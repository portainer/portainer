import { CellContext } from '@tanstack/react-table';

import { Badge, BadgeType } from '@@/Badge';

import { ContainerRowData } from '../types';

import { columnHelper } from './helper';

export const status = columnHelper.accessor('status', {
  header: 'Status',
  cell: StatusCell,
});

function StatusCell({ getValue }: CellContext<ContainerRowData, string>) {
  return <Badge type={getContainerStatusType(getValue())}>{getValue()}</Badge>;
}

function getContainerStatusType(status: string): BadgeType {
  switch (status.toLowerCase()) {
    case 'running':
      return 'success';
    case 'waiting':
      return 'warn';
    case 'terminated':
      return 'info';
    default:
      return 'danger';
  }
}
