import { AlertTriangle, GitCommit, WatchIcon } from 'lucide-react';
import moment from 'moment';

import { StackType } from '@/react/common/stacks/types';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';
import { SortableListItem } from '@@/SortableList/SortableListItem';

import { Workflow, WorkflowType } from './types';
import { StatusBadge, TypeBadge } from './WorkflowBadges';
import { WorkflowSubRow } from './WorkflowSubRow/WorkflowSubRow';

export function WorkflowCard({ item }: { item: Workflow }) {
  const { to, params } = getStackLink(item);

  return (
    <SortableListItem>
      <div className="flex gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-2 th-dark:bg-gray-8">
          <Icon icon={GitCommit} size="md" className="text-gray-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                to={to}
                params={params}
                data-cy={`workflow-link-${item.id}`}
                className="font-semibold tracking-wide text-gray-9 th-highcontrast:text-white th-dark:text-white"
              >
                {item.name}
              </Link>
              <StatusBadge status={item.status} />
              <TypeBadge type={item.type} />
            </div>
            <SyncLabel type={item.type} date={item.lastSyncDate} />
          </div>
          <WorkflowSubRow item={item} />
          {item.statusMessage && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-error-8">
              <Icon icon={AlertTriangle} size="sm" className="shrink-0" />
              {item.statusMessage}
            </div>
          )}
        </div>
      </div>
    </SortableListItem>
  );
}

function SyncLabel({ type, date }: { type: WorkflowType; date: number }) {
  const syncLabel = date ? moment.unix(date).fromNow() : '-';
  const syncTitle = type === 'edgeStack' ? 'Oldest sync' : 'Last sync';

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-3">
      <Icon icon={WatchIcon} size="xs" />
      <span>
        {syncTitle}: {syncLabel}
      </span>
    </div>
  );
}

function getStackLink(item: Workflow): { to: string; params: object } {
  if (item.type === 'edgeStack') {
    return { to: 'edge.stacks.edit', params: { stackId: item.id } };
  }
  if (item.platform === 'kubernetes') {
    return {
      to: 'kubernetes.applications.application',
      params: {
        endpointId: item.target.endpointId,
        namespace: item.target.namespace,
        name: item.name,
      },
    };
  }

  const type =
    item.platform === 'dockerSwarm'
      ? StackType.DockerSwarm
      : StackType.DockerCompose;

  return {
    to: 'docker.stacks.stack',
    params: {
      endpointId: item.target.endpointId,
      name: item.name,
      id: item.id,
      type,
      regular: true,
    },
  };
}
