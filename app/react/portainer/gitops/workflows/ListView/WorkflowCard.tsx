import { AlertTriangle, GitCommit, WatchIcon } from 'lucide-react';
import moment from 'moment';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';
import { SortableListItem } from '@@/SortableList/SortableListItem';

import { StatusBadge } from '../../components/StatusBadge';
import { useWorkflowSources } from '../queries/useWorkflowSources';
import { getWorkflowLink } from '../utils';
import { Workflow } from '../types';
import { effectiveWorkflowStatus } from '../status';

import { WorkflowSubRow } from './WorkflowSubRow/WorkflowSubRow';

export function WorkflowCard({ item }: { item: Workflow }) {
  const { to, params } = getWorkflowLink(item);

  const { status: effectiveStatus, error: errorMessage } =
    effectiveWorkflowStatus(item);

  const sources = useWorkflowSources(item.artifacts);
  const showArtifactHeaders = item.artifacts.length > 1;

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
              <StatusBadge status={effectiveStatus} />
            </div>
            <SyncLabel date={item.lastSyncDate} />
          </div>
          <div className="space-y-3">
            {item.artifacts.map((artifact) => (
              <WorkflowSubRow
                key={`${artifact.type}_${artifact.id}`}
                artifact={artifact}
                sources={sources}
                showHeader={showArtifactHeaders}
              />
            ))}
          </div>
          {errorMessage && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-error-8">
              <Icon icon={AlertTriangle} size="sm" className="shrink-0" />
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </SortableListItem>
  );
}

function SyncLabel({ date }: { date: number | undefined }) {
  const syncLabel = date ? moment.unix(date).fromNow() : '-';

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-3">
      <Icon icon={WatchIcon} size="xs" />
      <span>Last sync: {syncLabel}</span>
    </div>
  );
}
