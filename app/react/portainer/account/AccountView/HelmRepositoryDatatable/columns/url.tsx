import { CellContext } from '@tanstack/react-table';

import { HelmRepository } from '../types';

import { columnHelper } from './helper';

export const url = columnHelper.accessor('URL', { cell: UrlCell });

export function UrlCell({ getValue }: CellContext<HelmRepository, string>) {
  const name = getValue();

  return name;
}
