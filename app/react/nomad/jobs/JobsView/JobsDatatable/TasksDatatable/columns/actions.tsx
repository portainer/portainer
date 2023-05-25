import { Clock, FileText } from 'lucide-react';
import { CellContext } from '@tanstack/react-table';

import { Task } from '@/react/nomad/types';

import { Link } from '@@/Link';
import { Icon } from '@@/Icon';

import { columnHelper } from './helper';

export const actions = columnHelper.display({
  header: 'Task Actions',
  id: 'actions',
  meta: {
    width: '5px',
  },
  cell: ActionsCell,
});

export function ActionsCell({ row }: CellContext<Task, unknown>) {
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
