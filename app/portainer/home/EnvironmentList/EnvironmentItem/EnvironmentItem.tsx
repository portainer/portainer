import clsx from 'clsx';
import { useQuery } from 'react-query';
import { useEffect } from 'react';

import * as notifications from '@/portainer/services/notifications';
import { getTags } from '@/portainer/tags/tags.service';
import { getGroup } from '@/portainer/environment-groups/environment-groups.service';
import {
  isoDateFromTimestamp,
  humanize,
  stripProtocol,
} from '@/portainer/filters/filters';
import { type Environment, PlatformType } from '@/portainer/environments/types';
import {
  getPlatformType,
  isDockerEnvironment,
  isEdgeEnvironment,
} from '@/portainer/environments/utils';
import type { TagId } from '@/portainer/tags/types';
import { Button } from '@/portainer/components/Button';
import { Link } from '@/portainer/components/Link';
import { EnvironmentGroupId } from '@/portainer/environment-groups/types';
import { useIsAdmin } from '@/portainer/hooks/useUser';

import { EnvironmentIcon } from './EnvironmentIcon';
import { EdgeIndicator } from './EdgeIndicator';
import { EnvironmentStats } from './EnvironmentStats';
import styles from './EnvironmentItem.module.css';
import { EnvironmentStatusBadge } from './EnvironmentStatusBadge';

interface Props {
  homepageLoadTime?: number;
  environment: Environment;
  onClick(environment: Environment): void;
}

export function EnvironmentItem({
  environment,
  onClick,
  homepageLoadTime,
}: Props) {
  const isAdmin = useIsAdmin();
  const isEdge = isEdgeEnvironment(environment.Type);

  const snapshotTime = getSnapshotTime(environment);

  const groupName = useGroupName(environment.GroupId);
  const tags = useEnvironmentTags(environment.TagIds);
  const route = getRoute(environment);

  return (
    <div className={styles.root}>
      <Link
        className={clsx('blocklist-item', styles.item)}
        onClick={() => onClick(environment)}
        to={route}
        params={{
          endpointId: environment.Id,
          id: environment.Id,
        }}
      >
        <div className="blocklist-item-box">
          <span className={clsx('blocklist-item-logo', 'endpoint-item')}>
            <EnvironmentIcon type={environment.Type} />
          </span>
          <span className="col-sm-12">
            <div className="blocklist-item-line endpoint-item">
              <span>
                <span className="blocklist-item-title endpoint-item">
                  {environment.Name}
                </span>
                <span className="space-left blocklist-item-subtitle">
                  {isEdge ? (
                    <EdgeIndicator
                      edgeId={environment.EdgeID}
                      checkInInterval={environment.EdgeCheckinInterval}
                      lastCheckInDate={environment.LastCheckInDate}
                      homepageLoadTime={homepageLoadTime}
                    />
                  ) : (
                    <>
                      <EnvironmentStatusBadge status={environment.Status} />
                      <span className="space-left small text-muted">
                        {snapshotTime}
                      </span>
                    </>
                  )}
                </span>
              </span>
              <span className="small">
                <span>Group: </span>
                <span>{groupName}</span>
              </span>
            </div>
            <EnvironmentStats environment={environment} />
            <div className="blocklist-item-line endpoint-item">
              <span className="small text-muted">
                {isDockerEnvironment(environment.Type) && (
                  <span>
                    {environment.Snapshots.length > 0 && (
                      <span className="small text-muted">
                        <i className="fa fa-microchip space-right" />
                        {environment.Snapshots[0].TotalCPU}
                        <i className="fa fa-memory space-left space-right" />
                        {humanize(environment.Snapshots[0].TotalMemory)}
                      </span>
                    )}
                    <span className="space-left space-right">-</span>
                  </span>
                )}
                <span>
                  <i className="fa fa-tags space-right" aria-hidden="true" />
                  {tags}
                </span>
              </span>
              {!isEdge && (
                <span className="small text-muted">
                  {stripProtocol(environment.URL)}
                </span>
              )}
            </div>
          </span>
        </div>
      </Link>
      {isAdmin && (
        <Link
          to="portainer.endpoints.endpoint"
          params={{ id: environment.Id }}
          className={styles.editButton}
        >
          <Button color="link">
            <i className="fa fa-pencil-alt" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function useEnvironmentTags(tagIds?: TagId[]) {
  const { tags, isLoading } = useTags();

  if (isLoading) {
    return 'Loading tags...';
  }

  if (!tags || !tagIds) {
    return 'No tags';
  }

  return tagIds
    .map((id) => tags.find((t) => t.ID === id))
    .map((t) => t?.Name)
    .join(', ');
}

function getSnapshotTime(environment: Environment) {
  const platform = getPlatformType(environment.Type);

  switch (platform) {
    case PlatformType.Docker:
      return environment.Snapshots.length > 0
        ? isoDateFromTimestamp(environment.Snapshots[0].Time)
        : null;
    case PlatformType.Kubernetes:
      return environment.Kubernetes.Snapshots.length > 0
        ? isoDateFromTimestamp(environment.Kubernetes.Snapshots[0].Time)
        : null;
    default:
      return null;
  }
}

function getRoute(environment: Environment) {
  if (isEdgeEnvironment(environment.Type) && !environment.EdgeID) {
    return 'portainer.endpoints.endpoint';
  }

  const platform = getPlatformType(environment.Type);

  switch (platform) {
    case PlatformType.Azure:
      return 'azure.dashboard';
    case PlatformType.Docker:
      return 'docker.dashboard';
    case PlatformType.Kubernetes:
      return 'kubernetes.dashboard';
    default:
      return '';
  }
}

function useTags() {
  const { data, isError, error, isLoading } = useQuery(
    'tags',
    () => getTags(),
    {
      staleTime: 50,
    }
  );

  useEffect(() => {
    if (isError) {
      notifications.error('Failed loading tags', error as Error);
    }
  }, [isError, error]);

  return { tags: data, isLoading };
}

function useGroup(groupId: EnvironmentGroupId) {
  const { data, isError, error } = useQuery(
    ['environment-groups', groupId],
    () => getGroup(groupId),
    {
      staleTime: 50,
    }
  );

  useEffect(() => {
    if (isError) {
      notifications.error('Failed loading group', error as Error);
    }
  }, [isError, error]);

  return data;
}

function useGroupName(groupId: EnvironmentGroupId) {
  const group = useGroup(groupId);
  return group && group.Name;
}
