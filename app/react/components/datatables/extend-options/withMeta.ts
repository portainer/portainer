import { TableOptions } from '@tanstack/react-table';

import { DefaultType } from '../types';

import { OptionsExtension } from './types';

export function withMeta<D extends DefaultType>(
  meta: Record<string, unknown>
): OptionsExtension<D> {
  return function extendOptions(options: TableOptions<D>) {
    return {
      ...options,
      meta: {
        ...options.meta,
        ...meta,
      },
    };
  };
}
