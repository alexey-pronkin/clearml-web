import {Pipe, PipeTransform} from '@angular/core';

interface IOption {
  label: string;
  value: string;
}
@Pipe({
  name: 'selectOptionValueToLabel',
  standalone: true
})
export class SelectOptionValueToLabelPipe implements PipeTransform {
  transform(value: string, options: Array<IOption>): string {
    if (!options) {
      return value;
    }
    const option = options.find(option => option.value === value);
    return option?.label ?? value;
  }
}
