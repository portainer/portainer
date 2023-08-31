import { TableOptions } from '@tanstack/react-table';

import { defaultGlobalFilterFn } from '../Datatable';
import { DefaultType } from '../types';

export function withGlobalFilter<D extends DefaultType>(
  filterFn: typeof defaultGlobalFilterFn
) {
  return function extendOptions(options: TableOptions<D>) {
    return {
      ...options,
      globalFilterFn: filterFn,
    };
  };
}
