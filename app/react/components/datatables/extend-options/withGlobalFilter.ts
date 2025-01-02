import { TableOptions } from '@tanstack/react-table';

import { defaultGlobalFilterFn } from '../Datatable';
import { DefaultType } from '../types';

import { OptionsExtension } from './types';

export function withGlobalFilter<
  D extends DefaultType,
  TFilter extends {
    search: string;
  },
>(filterFn: typeof defaultGlobalFilterFn<D, TFilter>): OptionsExtension<D> {
  return function extendOptions(options: TableOptions<D>) {
    return {
      ...options,
      globalFilterFn: filterFn,
    };
  };
}
