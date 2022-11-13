import _ from 'lodash';
import { Tag } from 'react-feather';

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

import { EnvironmentIcon } from './EnvironmentIcon';
import { EnvironmentStats } from './EnvironmentStats';
import { EngineVersion } from './EngineVersion';
import { AgentVersionTag } from './AgentVersionTag';
import { EnvironmentBrowseButtons } from './EnvironmentBrowseButtons';
import { EditButtons } from './EditButtons';

interface Props {
  environment: Environment;
  groupName?: string;
  onClick(environment: Environment): void;
  isActive: boolean;
}

export function EnvironmentItem({
  environment,
  onClick,
  groupName,
  isActive,
}: Props) {
  const isEdge = isEdgeEnvironment(environment.Type);

  const snapshotTime = getSnapshotTime(environment);

  const tags = useEnvironmentTagNames(environment.TagIds);

  return (
    <div className="blocklist-item blocklist-item-not-interactive flex">
      <div className="ml-2 self-center flex justify-center">
        <EnvironmentIcon type={environment.Type} />
      </div>
      <div className="ml-3 flex justify-center gap-3 flex-col items-start">
        <div className="space-x-3 flex items-center">
          <span className="font-bold">{environment.Name}</span>

          {isEdge ? (
            <EdgeIndicator environment={environment} showLastCheckInDate />
          ) : (
            <>
              <EnvironmentStatusBadge status={environment.Status} />
              <span className="space-left small text-muted">
                {snapshotTime}
              </span>
            </>
          )}

          <EngineVersion environment={environment} />

          {!isEdge && (
            <span className="text-muted small vertical-center">
              {stripProtocol(environment.URL)}
            </span>
          )}
        </div>

        <div className="small text-muted space-x-2 vertical-center">
          {groupName && (
            <span className="font-semibold">
              <span>Group: </span>
              <span>{groupName}</span>
            </span>
          )}

          <span className="vertical-center">
            <Tag className="icon icon-sm space-right" aria-hidden="true" />
            {tags}
          </span>

          {isEdge && (
            <AgentVersionTag
              type={environment.Type}
              version={environment.Agent.Version}
            />
          )}
        </div>

        <EnvironmentStats environment={environment} />
      </div>

      <EnvironmentBrowseButtons
        environment={environment}
        onClickBrowse={() => onClick(environment)}
        isActive={isActive}
      />

      <EditButtons environment={environment} />
    </div>
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
