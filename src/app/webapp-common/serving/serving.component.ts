import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {setAutoRefresh} from '@common/core/actions/layout.actions';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {combineLatest, Observable, of} from 'rxjs';
import {SortMeta} from 'primeng/api';
import {ISmCol, TableSortOrderEnum} from '@common/shared/ui-components/data/table/table.consts';
import {SearchState, selectSearchQuery} from '@common/common-search/common-search.reducer';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {selectCompanyTags, selectProjectSystemTags, selectTagsFilterByProject} from '@common/core/reducers/projects.reducer';
import {distinctUntilChanged, filter, map, skip, tap, withLatestFrom} from 'rxjs/operators';
import {isEqual} from 'lodash-es';
import {Params} from '@angular/router';
import {createMetricColumn, decodeColumns, decodeFilter, decodeOrder} from '@common/shared/utils/tableParamEncode';
import {initSearch, resetSearch} from '@common/common-search/common-search.actions';
import {SelectionEvent} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {BaseEntityPageComponent} from '@common/shared/entity-page/base-entity-page';
import {modelServingRoutes, servingTableCols} from '@common/serving/serving.consts';
import {ServingActions} from '@common/serving/serving.actions';
import {ServingTableComponent} from '@common/serving/serving-table/serving-table.component';
import {servingFeature} from '@common/serving/serving.reducer';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {headerActions} from '@common/core/actions/router.actions';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';

type EndpointsTableViewMode = 'active' | 'loading';

@Component({
  selector: 'sm-serving',
  templateUrl: './serving.component.html',
  styleUrl: './serving.component.scss'
})
export class ServingComponent extends BaseEntityPageComponent implements OnInit, OnDestroy {
  public readonly originalTableColumns = servingTableCols;
  public entityTypeEnum = EntityTypeEnum;
  protected override entityType = EntityTypeEnum.endpoint;
  protected override inEditMode$: Observable<boolean> = of(false);
  public override showAllSelectedIsActive$: Observable<boolean> = of(false);
  public endpoints$: Observable<EndpointStats[]>;
  public tableSortFields$: Observable<SortMeta[]>;
  public tableSortOrder$: Observable<TableSortOrderEnum>;
  public selectedEndpoints$: Observable<EndpointStats[]>;
  public selectedEndpoint$: Observable<EndpointStats>;
  public searchValue$: Observable<SearchState['searchQuery']>;
  public tableFilters$: Observable<Record<string, FilterMetadata>>;
  public tableColsOrder$: Observable<string[]>;
  public tags$: Observable<string[]>;
  public tableMode$: Observable<'table' | 'info'>;
  public systemTags$: Observable<string[]>;
  public tableCols$: Observable<ISmCol[]>;
  public filteredTableCols$: Observable<ISmCol[]>;
  public firstEndpoint: EndpointStats;
  public metricVariants$: Observable<MetricVariantResult[]>;
  protected override setSplitSizeAction = ServingActions.setSplitSize;
  protected setTableModeAction = ServingActions.setTableViewMode;
  private selectedEndpoints: EndpointStats[];
  private searchQuery$: Observable<SearchState['searchQuery']>;
  // private isAppVisible$: Observable<boolean>;
  private readonly tagsFilter$: Observable<boolean>;
  private readonly companyTags$: Observable<string[]>;

  modelNamesOptions$ = this.store.select(servingFeature.modelNamesOptions);
  inputTypesOptions$ = this.store.select(servingFeature.inputTypesOptions);
  preprocessArtifactOptions$ = this.store.select(servingFeature.preprocessArtifactOptions);

  @ViewChild('endpointsTable') private table: ServingTableComponent;
  viewMode: EndpointsTableViewMode = this.route.snapshot.url[0].path as EndpointsTableViewMode;

  constructor() {
    super();
    this.selectSplitSize$ = this.store.select(servingFeature.selectSplitSize);
    this.tableSortFields$ = this.store.select(servingFeature.selectTableSortFields);
    this.selectedEndpoint$ = this.store.select(servingFeature.selectSelectedEndpoint);
    this.selectedEndpoints$ = this.store.select(servingFeature.selectSelectedEndpoints);
    this.tableFilters$ = this.store.select(servingFeature.selectColumnFilters);
    this.searchValue$ = this.store.select(servingFeature.selectGlobalFilter);
    this.metricVariants$ = this.store.select(servingFeature.selectMetricVariants);

    this.searchQuery$ = this.store.select(selectSearchQuery);
    this.tableColsOrder$ = this.store.select(servingFeature.selectColsOrder);
    this.tags$ = this.store.select(servingFeature.selectTags);
    this.tagsFilter$ = this.store.select(selectTagsFilterByProject);
    this.companyTags$ = this.store.select(selectCompanyTags);
    this.systemTags$ = this.store.select(selectProjectSystemTags);
    this.tableMode$ = this.store.select(servingFeature.selectTableMode);
    this.filteredTableCols$ = this.store.select(servingFeature.selectFilteredTableCols);

    this.tableCols$ = this.filteredTableCols$.pipe(
      distinctUntilChanged(isEqual),
      map(cols => cols.filter(col => !col.hidden))
    );

    this.endpoints$ = this.store.select(servingFeature.selectSortedFilteredEndpoints).pipe(
      filter(endpoints => endpoints !== null),
      tap(endpoints => {
        if (endpoints.length === 0) {
          this.router.navigate(['..', 'active'], {relativeTo: this.route, queryParamsHandling: 'preserve'});
        }
      })
    ) as Observable<EndpointStats[]>;
    this.syncAppSearch();

    this.setContextMenu();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.store.dispatch(ServingActions.fetchServingEndpoints());
    let prevQueryParams: Params;

    this.sub.add(this.route.queryParams
        .pipe(
          filter(queryParams => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {q, qreg, ...queryParamsWithoutSearch} = queryParams;
            const equal = isEqual(queryParamsWithoutSearch, prevQueryParams);
            prevQueryParams = queryParamsWithoutSearch;
            return !equal;
          })
        )
        .subscribe(params => {
          if (Object.keys(params || {}).length === 0) {
            this.emptyUrlInit();
          } else {
            if (params.order) {
              const orders = decodeOrder(params.order);
              this.store.dispatch(ServingActions.setTableSort({orders}));
            }
            if (params.filter) {
              const filters = decodeFilter(params.filter);
              this.store.dispatch(ServingActions.setTableFilters({filters}));
            } else {
              if (params.order) {
                this.store.dispatch(ServingActions.setTableFilters({filters: []}));
              }
            }

            if (params.columns) {
              const [, metrics, , , allIds] = decodeColumns(params.columns, this.originalTableColumns);
              const hiddenCols = {};
              this.originalTableColumns.forEach((tableCol) => {
                if (tableCol.id !== 'selected') {
                  hiddenCols[tableCol.id] = !params.columns.includes(tableCol.id);
                }
              });
              this.store.dispatch(ServingActions.setHiddenCols({hiddenCols}));
              this.store.dispatch(ServingActions.setExtraColumns({
                columns: metrics.map(metricCol => createMetricColumn(metricCol, undefined))
              }));
              this.columnsReordered(allIds, false);
            }
          }
        })
    );

    this.sub.add(this.selectedEndpoints$.subscribe(ServingEndpoints => this.selectedEndpoints = ServingEndpoints));

    this.selectEndpointFromUrl();
    // this.store.dispatch(ServingActions.getTags());
    // this.store.dispatch(getTags());
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.store.dispatch(ServingActions.resetState());
    this.stopSyncSearch();
  }

  private emptyUrlInit() {
    this.store.dispatch(ServingActions.updateUrlParamsFromState());
    this.shouldOpenDetails = true;
  }

  getSelectedEntities() {
    return this.selectedEndpoints;
  }

  stopSyncSearch() {
    this.store.dispatch(resetSearch());
    this.store.dispatch(ServingActions.resetGlobalFilter());
  }

  syncAppSearch() {
    this.store.dispatch(initSearch({payload: 'Search for endpoints'}));
    this.sub.add(this.searchQuery$.pipe(skip(1)).subscribe(query => this.store.dispatch(ServingActions.globalFilterChanged(query))));
  }

  getNextEndpoints() {
    this.store.dispatch(ServingActions.getNextServingEndpoints());
  }

  selectEndpointFromUrl() {
    this.sub.add(combineLatest([
        this.store.select(selectRouterParams).pipe(
          map(params => params.endpointId),
          distinctUntilChanged()),
        this.endpoints$.pipe(filter(items => items?.length > 0))
      ])
        .pipe(
          withLatestFrom(this.store.select(servingFeature.selectTableMode)),
          map(([[id, endpoints], mode]) => {
            this.firstEndpoint = endpoints?.[0];
            if (!id && this.shouldOpenDetails && this.firstEndpoint && mode === 'info') {
              this.shouldOpenDetails = false;
              this.store.dispatch(ServingActions.servingEndpointSelectionChanged({servingEndpoint: this.firstEndpoint}));
            } else {
              this.store.dispatch(ServingActions.setTableViewMode({mode: id ? 'info' : 'table'}));
            }
            return id ? endpoints?.find(endpoint => endpoint.id === id) ?? endpoints[0] : null;
          }),
          distinctUntilChanged(),
          filter(a => !!a)
        )
        .subscribe((endpoint) => {
          this.store.dispatch(ServingActions.setSelectedServingEndpoint({endpoint}));
        })
    );
  }

  endpointSelectionChanged(event: { endpoint: EndpointStats; openInfo?: boolean }) {
    if ((this.minimizedView || event.openInfo) && event.endpoint) {
      this.store.dispatch(ServingActions.servingEndpointSelectionChanged({
        servingEndpoint: event.endpoint
      }));
    }
    if (this.minimizedView && !event.openInfo && !event.endpoint) {
      this.router.navigate(['..', 'active'], {relativeTo: this.route, queryParamsHandling: 'merge'});
    }
  }

  endpointsSelectionChanged(endpoints: EndpointStats[]) {
    this.store.dispatch(ServingActions.setSelectedServingEndpoint({endpoint: endpoints[0]}));
  }

  sortedChanged({colId, isShift}: { isShift: boolean; colId: string }) {
    this.store.dispatch(ServingActions.tableSortChanged({colId, isShift}));
  }

  filterChanged({col, value, andFilter}: { col: ISmCol; value: any; andFilter?: boolean }) {

    this.store.dispatch(ServingActions.tableFiltersChanged({
      filters: [{
        col: col.id,
        value,
        filterMatchMode: col.filterMatchMode || andFilter ? 'AND' : undefined
      }],
    }));
  }

  refreshList(isAutorefresh: boolean) {
    this.store.dispatch(ServingActions.refreshEndpoints({hideLoader: isAutorefresh, autoRefresh: isAutorefresh}));
  }

  setAutoRefresh(autoRefresh: boolean) {
    this.store.dispatch(setAutoRefresh({autoRefresh}));
  }

  columnsReordered(cols: string[], updateUrl = true) {
    this.store.dispatch(ServingActions.setColsOrder({cols}));
    if (updateUrl) {
      this.store.dispatch(ServingActions.updateUrlParamsFromState());
    }
  }

  selectedTableColsChanged(col) {
    this.store.dispatch(ServingActions.toggleColHidden({columnId: col.id}));
  }

  columnResized(event: { columnId: string; widthPx: number }) {
    this.store.dispatch(ServingActions.setColumnWidth({...event}));
  }

  refreshTagsList() {
    this.store.dispatch(ServingActions.getTags());
  }

  protected getParamId(params) {
    return params?.endpointId;
  }

  clearTableFiltersHandler(tableFilters: Record<string, FilterMetadata>) {
    const filters = Object.keys(tableFilters).map(col => ({col, value: []}));
    this.store.dispatch(ServingActions.tableFiltersChanged({filters}));
  }

  getCustomMetrics() {
    this.store.dispatch(ServingActions.getCustomMetrics());
  }

  removeColFromList(id: string) {
    if (id.startsWith('last_metrics')) {
      this.store.dispatch(ServingActions.removeMetricColumn({id}));
    } else {
      this.store.dispatch(ServingActions.removeColumn({id: id.split('.')[1]}));
    }
  }

  modeChanged(mode: 'table' | 'info') {
    if (mode === 'info') {
      this.store.dispatch(ServingActions.setTableViewMode({mode}));
      if (this.firstEndpoint) {
        this.store.dispatch(ServingActions.servingEndpointSelectionChanged({
          servingEndpoint: this.selectedEndpoints?.[0] || this.firstEndpoint
        }));
      }
      return Promise.resolve()
    } else {
      return this.closePanel();
    }
  }

  override closePanel(queryParams?: Params) {
    window.setTimeout(() => this.infoDisabled = false);
    this.store.dispatch(this.setTableModeAction({mode: 'table'}));
    return this.router.navigate(this.minimizedView ? [{}] : [], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams
    });
  }

  selectedMetricToShow(event: SelectionEvent) {
    if (!event.valueType) {
      return;
    }
    const variantCol = createMetricColumn({
      metricHash: event.variant.metric_hash,
      variantHash: event.variant.variant_hash,
      valueType: event.valueType,
      metric: event.variant.metric,
      variant: event.variant.variant
    }, this.projectId);
    if (event.addCol) {
      this.store.dispatch(ServingActions.addColumn({col: variantCol}));
    } else {
      this.store.dispatch(ServingActions.removeMetricColumn({id: variantCol.id}));
    }
  }

  downloadTableAsCSV() {
    this.table.table.downloadTableAsCSV(`ClearML All Endpoints`);
  }

  override onFooterHandler(): void {
    return;
  }
  override afterArchiveChanged() {
    return;
  }

  private setContextMenu() {
    this.route.url
      .pipe(
        takeUntilDestroyed(),
        filter(config => !!config),
      )    .subscribe((conf) => {
      const contextMenu = modelServingRoutes
        .map(route => {
          const baseLink = route.link.at(-1);
          return {
            ...route,
            isActive: baseLink === conf[0]?.path
          };
        });
      this.store.dispatch(headerActions.setTabs({contextMenu}));
    });
  }

}
