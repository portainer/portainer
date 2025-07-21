import { CellContext } from '@tanstack/react-table';

import { pluralize } from '@/react/common/string-utils';

import { Badge } from '@@/Badge';
import { Tooltip } from '@@/Tip/Tooltip';

import { ContainerRowData } from '../types';

import { columnHelper } from './helper';

export const status = columnHelper.accessor('status', {
  header: 'Status',
  cell: StatusCell,
});

function StatusCell({
  getValue,
}: CellContext<ContainerRowData, ContainerRowData['status']>) {
  const statusData = getValue();

  return (
    <Badge type={statusData.type}>
      <div className="flex items-center gap-1">
        <span>
          {statusData.status}
          {statusData.restartCount &&
            ` (Restarted ${statusData.restartCount} ${pluralize(
              statusData.restartCount,
              'time'
            )})`}
        </span>
      </div>
      {statusData.message && <Tooltip message={statusData.message} />}
    </Badge>
  );
}
