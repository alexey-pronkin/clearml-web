import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'sm-clear-filters-button',
  templateUrl: `./clear-filters-button.component.html`,
  styleUrls: ['./clear-filters-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TooltipDirective,
    MatIconButton,
    MatIcon
  ]
})
export class ClearFiltersButtonComponent {
  tableFilters = input();
  clearTableFilters = output();
  protected isTableFiltered = computed(() => Object.values(this.tableFilters() ?? {}).some(({value}) => value?.length > 0));
}
