import { AlertTriangle, GitCommit, Server, WatchIcon } from 'lucide-react';
import moment from 'moment';

import { Icon } from '@@/Icon';
import { SortableListItem } from '@@/SortableList/SortableListItem';

import { StatusBadge } from '../../WorkflowsView/WorkflowBadges';
import { Source, SOURCE_TYPES } from '../types';

import { StatBlock } from './StatBlock';

export function SourceCard({ item }: { item: Source }) {
  const { icon: TypeIcon } = SOURCE_TYPES[item.type];
  const lastSyncLabel = item.lastSync
    ? moment.unix(item.lastSync).fromNow()
    : '-';

  return (
    <SortableListItem>
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-2 th-highcontrast:bg-gray-8 th-dark:bg-gray-8">
          <Icon icon={TypeIcon} size="md" className="text-gray-6" />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold tracking-wide text-gray-9 th-highcontrast:text-white th-dark:text-white">
                {item.name}
              </span>
              <StatusBadge status={item.status} />
            </div>
            <span className="truncate text-sm text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-3">
              {item.url}
            </span>
            {item.error && (
              <div className="flex items-center gap-1.5 text-xs text-error-8">
                <Icon icon={AlertTriangle} size="sm" className="shrink-0" />
                {item.error}
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <StatBlock icon={GitCommit} label="Workflows" value={item.usedBy} />
            <StatBlock
              icon={Server}
              label="Environments"
              value={item.environments}
            />
            <StatBlock
              icon={WatchIcon}
              label="Last sync"
              value={lastSyncLabel}
            />
          </div>
        </div>
      </div>
    </SortableListItem>
  );
}
