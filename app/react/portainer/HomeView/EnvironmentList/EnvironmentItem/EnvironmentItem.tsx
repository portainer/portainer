import _ from 'lodash';
import { Tag, Globe, Activity } from 'lucide-react';

import {
  isoDateFromTimestamp,
  stripProtocol,
} from '@/portainer/filters/filters';
import {
  type Environment,
  PlatformType,
} from '@/react/portainer/environments/types';
import {
  getPlatformType,
  isEdgeEnvironment,
} from '@/react/portainer/environments/utils';
import type { TagId } from '@/portainer/tags/types';
import { useTags } from '@/portainer/tags/queries';

import { EdgeIndicator } from '@@/EdgeIndicator';
import { EnvironmentStatusBadge } from '@@/EnvironmentStatusBadge';
import { Checkbox } from '@@/form-components/Checkbox';

import { EnvironmentIcon } from './EnvironmentIcon';
import { EnvironmentStats } from './EnvironmentStats';
import { EngineVersion } from './EngineVersion';
import { AgentVersionTag } from './AgentVersionTag';
import { EnvironmentBrowseButtons } from './EnvironmentBrowseButtons';
import { EditButtons } from './EditButtons';

interface Props {
  environment: Environment;
  groupName?: string;
  onClickBrowse(): void;
  onSelect(isSelected: boolean): void;
  isSelected: boolean;
  isActive: boolean;
}

export function EnvironmentItem({
  environment,
  onClickBrowse,
  groupName,
  isActive,
  isSelected,
  onSelect,
}: Props) {
  const isEdge = isEdgeEnvironment(environment.Type);

  const snapshotTime = getSnapshotTime(environment);

  const tags = useEnvironmentTagNames(environment.TagIds);

  return (
    <label className="relative">
      <div className="absolute top-2 left-2">
        <Checkbox
          id={`environment-select-${environment.Id}`}
          checked={isSelected}
          onChange={() => onSelect(!isSelected)}
        />
      </div>
      <div className="blocklist-item flex overflow-hidden min-h-[100px]">
        <div className="ml-2 self-center flex justify-center">
          <EnvironmentIcon type={environment.Type} />
        </div>
        <div className="ml-3 mr-auto flex justify-center gap-3 flex-col items-start">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-bold">{environment.Name}</span>
            {isEdge ? (
              <EdgeIndicator environment={environment} showLastCheckInDate />
            ) : (
              <>
                <EnvironmentStatusBadge status={environment.Status} />
                {snapshotTime && (
                  <span
                    className="small text-muted vertical-center gap-1"
                    title="Last snapshot time"
                  >
                    <Activity className="icon icon-sm" aria-hidden="true" />
                    {snapshotTime}
                  </span>
                )}
              </>
            )}
            <EngineVersion environment={environment} />
            {!isEdge && (
              <span className="text-muted small vertical-center">
                {stripProtocol(environment.URL)}
              </span>
            )}
          </div>
          <div className="small text-muted flex items-center gap-x-4 gap-y-2">
            {groupName && (
              <span className="font-semibold">
                <span>Group: </span>
                <span>{groupName}</span>
              </span>
            )}
            <span className="vertical-center gap-1">
              <Tag className="icon icon-sm" aria-hidden="true" />
              {tags}
            </span>
            {isEdge && (
              <>
                <AgentVersionTag
                  type={environment.Type}
                  version={environment.Agent.Version}
                />
                {environment.Edge.AsyncMode && (
                  <span className="vertical-center gap-1">
                    <Globe className="icon icon-sm" aria-hidden="true" />
                    Async Environment
                  </span>
                )}
              </>
            )}
          </div>
          <EnvironmentStats environment={environment} />
        </div>
        <EnvironmentBrowseButtons
          environment={environment}
          onClickBrowse={onClickBrowse}
          isActive={isActive}
        />
        <EditButtons environment={environment} />
      </div>
    </label>
  );
}

function useEnvironmentTagNames(tagIds?: TagId[]) {
  const { tags, isLoading } = useTags((tags) => {
    if (!tagIds) {
      return [];
    }
    return _.compact(
      tagIds
        .map((id) => tags.find((tag) => tag.ID === id))
        .map((tag) => tag?.Name)
    );
  });

  if (tags && tags.length > 0) {
    return tags.join(', ');
  }

  if (isLoading) {
    return 'Loading tags...';
  }

  return 'No tags';
}

function getSnapshotTime(environment: Environment) {
  const platform = getPlatformType(environment.Type);

  switch (platform) {
    case PlatformType.Docker:
      return environment.Snapshots.length > 0
        ? isoDateFromTimestamp(environment.Snapshots[0].Time)
        : null;
    case PlatformType.Kubernetes:
      return environment.Kubernetes.Snapshots &&
        environment.Kubernetes.Snapshots.length > 0
        ? isoDateFromTimestamp(environment.Kubernetes.Snapshots[0].Time)
        : null;
    default:
      return null;
  }
}
