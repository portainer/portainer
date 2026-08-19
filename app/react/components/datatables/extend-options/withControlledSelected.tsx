import {
  RowSelectionState,
  TableOptions,
  Updater,
} from '@tanstack/react-table';

import { DefaultType } from '../types';

import { OptionsExtension } from './types';

export function withControlledSelected<D extends DefaultType>(
  onChange?: (value: string[]) => void,
  value?: string[]
): OptionsExtension<D> {
  return function extendTableOptions(options: TableOptions<D>) {
    if (!onChange || !value) {
      return options;
    }

    return {
      ...options,
      state: {
        ...options.state,
        rowSelection: Object.fromEntries(value.map((i) => [i, true])),
      },
      onRowSelectionChange(updater: Updater<RowSelectionState>) {
        const newValue =
          typeof updater !== 'function'
            ? updater
            : updater(Object.fromEntries(value.map((i) => [i, true])));
        onChange(
          Object.entries(newValue)
            .filter(([, selected]) => selected)
            .map(([id]) => id)
        );
      },
    };
  };
}
