import {AfterViewInit, Component, EventEmitter, input, Output, QueryList, ViewChildren} from '@angular/core';
import {DatePipe, NgSwitch, NgSwitchCase, NgSwitchDefault, TitleCasePipe} from '@angular/common';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PrimeTemplate} from 'primeng/api';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {trackByIndex} from '@common/shared/utils/forms-track-by';
import {filter, take} from 'rxjs/operators';
import {
  TasksGetOperationsLogResponseOperations
} from '~/business-logic/model/tasks/tasksGetOperationsLogResponseOperations';
import {EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';


@Component({
  selector: 'sm-experiment-operations-log',
  templateUrl: './experiment-operations-log.component.html',
  styleUrls: ['./experiment-operations-log.component.scss'],
  imports: [
    DatePipe,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    TableComponent,
    PrimeTemplate,
    NgSwitchCase,
    NgSwitchDefault,
    NgSwitch,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    TitleCasePipe,
  ],
  standalone: true
})
export class ExperimentOperationsLogComponent implements AfterViewInit {
  OPERATIONS = {...EXPERIMENTS_STATUS_LABELS, archived: 'Archived'};

  columns: ISmCol[] = [
    {
      id: 'operation',
      header: 'New status',
      key: 'operation',
      bodyStyleClass: '',
    },
    {
      id: 'reason',
      header: 'Reason',
      key: 'reason',
      style: {maxWidth: '360px'}
    },
    {
      id: 'created',
      header: 'Timestamp',
      key: 'created',
    }, {
      id: 'user',
      header: 'User',
      key: 'user',
      getter: 'user.name',
    },
    {
      id: 'ip',
      header: 'ip',
      key: 'ip',
      hidden: true,
      includeInDownload: true,
      style: {maxWidth: '80px'}
    }, {
      id: 'originator',
      header: 'Source',
      key: 'originator',
    }, {
      id: 'originator_version',
      header: 'Source version',
      key: 'originator_version',
    }, {
      id: 'info',
      header: 'Info',
      key: 'info',
      style: {maxWidth: '360px'}
    },
  ];
  public table: TableComponent<{ id: string }>;

  lines = input<TasksGetOperationsLogResponseOperations[]>([]);
  @Output() downloadFullLog = new EventEmitter();
  @Output() openFullLog = new EventEmitter();
  @ViewChildren(TableComponent) tables: QueryList<TableComponent<{ id: string }>>;

  protected readonly trackByIndex = trackByIndex;

  ngAfterViewInit(): void {
    this.tables.changes
      .pipe(filter((comps: QueryList<TableComponent<{ id: string }>>) => !!comps.first), take(1))
      .subscribe((comps: QueryList<TableComponent<{ id: string }>>) => {
        this.table = comps.first;
      });
    this.tables.forEach(item => this.table = item);
  }
}
