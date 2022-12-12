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
  getDashboardRoute,
  getPlatformType,
  isEdgeEnvironment,
} from '@/react/portainer/environments/utils';
import type { TagId } from '@/portainer/tags/types';
import { useTags } from '@/portainer/tags/queries';

import { EdgeIndicator } from '@@/EdgeIndicator';
import { EnvironmentStatusBadge } from '@@/EnvironmentStatusBadge';
import { Link } from '@@/Link';

import { EnvironmentIcon } from './EnvironmentIcon';
import { EnvironmentStats } from './EnvironmentStats';
import { EngineVersion } from './EngineVersion';
import { AgentVersionTag } from './AgentVersionTag';
import { EditButtons } from './EditButtons';

interface Props {
  environment: Environment;
  groupName?: string;
  onClick(environment: Environment): void;
}

export function EnvironmentItem({ environment, onClick, groupName }: Props) {
  const isEdge = isEdgeEnvironment(environment.Type);

  const snapshotTime = getSnapshotTime(environment);

  const tags = useEnvironmentTagNames(environment.TagIds);
  const route = getDashboardRoute(environment);

  return (
    <button
      type="button"
      onClick={() => onClick(environment)}
      className="bg-transparent border-0 !p-0 !m-0"
    >
      <Link
        className="blocklist-item flex no-link overflow-hidden min-h-[100px]"
        to={route}
        params={{
          endpointId: environment.Id,
          id: environment.Id,
        }}
      >
        <div className="ml-2 self-center flex justify-center">
          <EnvironmentIcon type={environment.Type} />
        </div>
        <div className="ml-3 mr-auto flex justify-center gap-3 flex-col items-start">
          <div className="space-x-3 flex items-center">
            <span className="font-bold">{environment.Name}</span>

            {isEdge ? (
              <EdgeIndicator environment={environment} showLastCheckInDate />
            ) : (
              <>
                <EnvironmentStatusBadge status={environment.Status} />
                {snapshotTime && (
                  <span
                    className="space-left small text-muted vertical-center"
                    title="Last snapshot time"
                  >
                    <Activity
                      className="icon icon-sm space-right"
                      aria-hidden="true"
                    />
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
              <>
                <AgentVersionTag
                  type={environment.Type}
                  version={environment.Agent.Version}
                />

                {environment.Edge.AsyncMode && (
                  <span className="vertical-center gap-1">
                    <Globe
                      className="icon icon-sm space-right"
                      aria-hidden="true"
                    />
                    Async Environment
                  </span>
                )}
              </>
            )}
          </div>

          <EnvironmentStats environment={environment} />
        </div>

        <EditButtons environment={environment} />
      </Link>
    </button>
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
