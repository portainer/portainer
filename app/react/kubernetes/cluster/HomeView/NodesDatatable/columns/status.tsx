import { CellContext } from '@tanstack/react-table';

import { StatusBadge } from '@@/StatusBadge';

import { NodeRowData } from '../types';

import { columnHelper } from './helper';

export const status = columnHelper.accessor((row) => getStatus(row), {
  header: 'Status',
  cell: StatusCell,
});

function StatusCell({
  row: { original: node },
}: CellContext<NodeRowData, string>) {
  const status = getStatus(node);

  const isDeleting =
    node.metadata?.annotations?.['portainer.io/removing-node'] === 'true';
  if (isDeleting) {
    return <StatusBadge color="warning">Removing</StatusBadge>;
  }

  return (
    <div className="inline-flex whitespace-nowrap gap-x-2">
      <StatusBadge color={status === 'Ready' ? 'success' : 'warning'}>
        {status}
      </StatusBadge>
      {node.spec?.unschedulable && (
        <StatusBadge color="warning">SchedulingDisabled</StatusBadge>
      )}
    </div>
  );
}

function getStatus(node: NodeRowData) {
  return (
    // only look for the ready type to identify if the node is either ready or not ready
    node.status?.conditions?.find(
      (condition) => condition.status === 'True' && condition.type === 'Ready'
    )?.type ?? 'Not Ready'
  );
}
