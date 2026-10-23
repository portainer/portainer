import { LayoutGrid, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { ResourceDetailHeader } from '@@/ResourceDetailHeader/ResourceDetailHeader';
import { ResourceStatBlock } from '@@/ResourceDetailHeader/ResourceStatBlock';
import { ActionBarShell } from '@@/ResourceDetailHeader/ActionBarShell';
import { ActionBarButton } from '@@/ResourceDetailHeader/ActionBarButton';
import { HeaderStats } from '@@/ResourceDetailHeader/HeaderStats';

import { EnvironmentGroup } from '../types';
import { PlatformBadge } from '../components/PlatformBadge';
import { EnvironmentTypeBreakdown } from '../components/EnvironmentTypeBreakdown';

interface Props {
  group?: EnvironmentGroup;
  isLoading?: boolean;
  onRefresh?: () => void;
  onAddEnvironments?: () => void;
  onDelete?: () => void;
}

export function GroupHeader({
  group,
  isLoading,
  onRefresh,
  onAddEnvironments,
  onDelete,
}: Props) {
  const actionBar = group ? (
    <ActionBarShell>
      <div className="flex items-center gap-3">
        <ActionBarButton
          icon={RefreshCw}
          onClick={() => onRefresh?.()}
          data-cy="group-header-refresh"
        >
          Refresh
        </ActionBarButton>
        <ActionBarButton
          icon={Plus}
          onClick={() => onAddEnvironments?.()}
          data-cy="group-header-add-environments"
        >
          Add environments
        </ActionBarButton>
      </div>
      <div className="flex items-center gap-1">
        <ActionBarButton
          icon={Trash2}
          onClick={() => onDelete?.()}
          data-cy="group-header-delete"
          color="dangerlight"
        >
          Delete
        </ActionBarButton>
      </div>
    </ActionBarShell>
  ) : undefined;

  return (
    <ResourceDetailHeader
      isLoading={isLoading}
      errorMessage={
        !isLoading && !group ? 'Failed to load group details' : undefined
      }
      icon={
        <LayoutGrid className="!text-group-accent-8 th-dark:!text-group-accent-2" />
      }
      subtitleLabel="Environment Group"
      title={group?.Name || ''}
      badge={group && <PlatformBadge group={group} />}
      description={group?.Description}
      rightInfo={
        group && (
          <HeaderStats>
            <ResourceStatBlock>
              <ResourceStatBlock.Label>Environments</ResourceStatBlock.Label>
              <ResourceStatBlock.Value>
                <EnvironmentTypeBreakdown group={group} />
              </ResourceStatBlock.Value>
            </ResourceStatBlock>
          </HeaderStats>
        )
      }
      actionBar={actionBar}
    />
  );
}
