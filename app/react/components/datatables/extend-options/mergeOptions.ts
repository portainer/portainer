import { TableOptions } from '@tanstack/react-table';

import { OptionsExtension } from './types';

export function mergeOptions<D>(
  ...extenders: Array<OptionsExtension<D>>
): OptionsExtension<D> {
  return (options: TableOptions<D>) =>
    extenders.reduce((acc, option) => option(acc), options);
}
