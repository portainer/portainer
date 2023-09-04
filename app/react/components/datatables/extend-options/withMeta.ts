import { TableOptions } from '@tanstack/react-table';

import { DefaultType } from '../types';

export function withMeta<D extends DefaultType>(meta: Record<string, unknown>) {
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
