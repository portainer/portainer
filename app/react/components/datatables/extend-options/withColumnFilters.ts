import { ColumnFiltersState, TableOptions } from '@tanstack/react-table';

import { applySetStateAction } from '@/react-tools/apply-set-state-action';

import { DefaultType } from '../types';

import { OptionsExtension } from './types';

export function withColumnFilters<D extends DefaultType>(
  filters: ColumnFiltersState,
  onChange: (filters: ColumnFiltersState) => void
): OptionsExtension<D> {
  return function extendOptions(options: TableOptions<D>) {
    return {
      ...options,
      state: {
        ...options.state,
        columnFilters: filters,
      },
      onColumnFiltersChange: (updater) => {
        onChange(applySetStateAction(updater, filters));
      },
      initialState: {
        ...options.initialState,
        columnFilters: filters,
      },
    };
  };
}
