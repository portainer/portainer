import { CellProps, Column } from 'react-table';
import { Clock, FileText } from 'lucide-react';

import { Task } from '@/react/nomad/types';

import { Link } from '@@/Link';
import { Icon } from '@@/Icon';

export const actions: Column<Task> = {
  Header: 'Task Actions',
  id: 'actions',
  disableFilters: true,
  canHide: true,
  disableResizing: true,
  width: '5px',
  sortType: 'string',
  Filter: () => null,
  Cell: ActionsCell,
};

export function ActionsCell({ row }: CellProps<Task>) {
  const params = {
    allocationID: row.original.AllocationID,
    taskName: row.original.TaskName,
    namespace: row.original.Namespace,
    jobID: row.original.JobID,
  };

  return (
    <div className="vertical-center text-center">
      {/* events */}
      <Link
        to="nomad.events"
        params={params}
        title="Events"
        className="space-right"
      >
        <Icon icon={Clock} className="space-right" />
      </Link>

      {/* logs */}
      <Link to="nomad.logs" params={params} title="Logs">
        <Icon icon={FileText} className="space-right" />
      </Link>
    </div>
  );
}
