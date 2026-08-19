import { LayoutGrid, Columns3Cog, Users } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from '@uirouter/react';

import { Tag } from '@/portainer/tags/types';

import { Link } from '@@/Link';
import { Badge } from '@@/Badge';
import { Button } from '@@/buttons';

import { EnvironmentGroup } from '../../types';
import { EnvironmentTypeBreakdown } from '../../components/EnvironmentTypeBreakdown';
import { PlatformBadge } from '../../components/PlatformBadge';
import { isUngoverned } from '../../utils/getPlatformLabel';

interface Props {
  group: EnvironmentGroup;
  tags?: Tag[];
}

export function EnvironmentGroupRow({ group, tags }: Props) {
  const router = useRouter();
  const ungoverned = isUngoverned(group);

  function handleRowClick() {
    if (!ungoverned) {
      router.stateService.go('portainer.groups.group', { id: group.Id });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!ungoverned && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleRowClick();
    }
  }

  return (
    <div
      className={clsx(
        'group flex items-center gap-5 border-0 border-t border-solid border-gray-4 px-5 py-4 transition-colors',
        ungoverned
          ? 'cursor-default bg-gray-2 th-highcontrast:bg-gray-10 th-dark:bg-gray-10'
          : 'cursor-pointer hover:bg-gray-2 th-dark:hover:bg-gray-9',
        'th-dark:border-gray-8'
      )}
      data-cy={`environment-group-row-${group.Name}`}
      onClick={ungoverned ? undefined : handleRowClick}
      onKeyDown={ungoverned ? undefined : handleKeyDown}
      role={ungoverned ? undefined : 'button'}
      tabIndex={ungoverned ? undefined : 0}
    >
      {/* Icon */}
      <div
        className={clsx(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl',
          ungoverned
            ? 'bg-warning-7 th-dark:bg-warning-10'
            : 'bg-blue-3 th-dark:bg-blue-9'
        )}
      >
        {ungoverned ? (
          <Columns3Cog
            className={clsx(
              'h-6 w-6',
              '!text-warning-4 th-dark:text-warning-3'
            )}
          />
        ) : (
          <LayoutGrid
            className={clsx('h-6 w-6', 'text-blue-9 th-dark:text-blue-3')}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + Tag badges */}
        <div className="flex items-center gap-3">
          <span
            className={clsx(
              'text-sm font-bold',
              ungoverned
                ? 'text-warning-7 th-dark:text-warning-3'
                : 'text-gray-8 th-highcontrast:text-white th-dark:text-gray-2'
            )}
            data-cy={`environment-group-name-${group.Name}`}
          >
            {group.Name}
          </span>
          {!ungoverned && <PlatformBadge group={group} />}
          {!ungoverned &&
            group.TagIds?.map((tagId) => {
              const tag = tags?.find((t) => t.ID === tagId);
              return (
                <Badge key={tagId} type="info" className="text-xs">
                  {tag?.Name ?? `Tag ${tagId}`}
                </Badge>
              );
            })}
        </div>

        {/* Meta info */}
        <div
          className={clsx(
            'mt-1 flex items-center gap-4 text-xs',
            ungoverned
              ? 'text-warning-7 th-dark:text-warning-4'
              : 'text-gray-7 th-highcontrast:text-white group-hover:th-highcontrast:text-gray-11 th-dark:text-gray-5'
          )}
        >
          <EnvironmentTypeBreakdown group={group} />
        </div>
      </div>

      {/* Action buttons */}
      {!ungoverned && (
        <div className="flex items-center gap-1">
          <Button
            as={Link}
            props={{
              to: 'portainer.groups.group',
              params: { id: group.Id, tab: 'access' },
            }}
            color="link"
            icon={Users}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            data-cy={`manage-access-button_${group.Name}`}
          >
            Manage access
          </Button>
        </div>
      )}
    </div>
  );
}
