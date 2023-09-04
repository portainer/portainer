import { TableOptions } from '@tanstack/react-table';

import { defaultGlobalFilterFn } from '../Datatable';
import { DefaultType } from '../types';

export function withGlobalFilter<
  D extends DefaultType,
  TFilter extends {
    search: string;
  },
>(filterFn: typeof defaultGlobalFilterFn<D, TFilter>) {
  return function extendOptions(options: TableOptions<D>) {
    return {
      ...options,
      globalFilterFn: filterFn,
    };
  };
}
