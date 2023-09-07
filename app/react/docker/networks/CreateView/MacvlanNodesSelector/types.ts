import { TableMeta as BaseTableMeta } from '@tanstack/react-table';

import { NodeViewModel } from '@/docker/models/node';

export type TableMeta = BaseTableMeta<NodeViewModel> & {
  table: 'macvlan-nodes';
  haveAccessToNode: boolean;
};

export function isTableMeta(
  meta?: BaseTableMeta<NodeViewModel>
): meta is TableMeta {
  return !!meta && meta.table === 'macvlan-nodes';
}
