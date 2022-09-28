import clsx from 'clsx';
import _ from 'lodash';
import { Edit2, Tag, Cpu } from 'react-feather';

import {
  isoDateFromTimestamp,
  humanize,
  stripProtocol,
} from '@/portainer/filters/filters';
import {
  type Environment,
  PlatformType,
} from '@/react/portainer/environments/types';
import {
  getPlatformType,
  isDockerEnvironment,
  isEdgeEnvironment,
} from '@/react/portainer/environments/utils';
import type { TagId } from '@/portainer/tags/types';
import { useTags } from '@/portainer/tags/queries';
import { useUser } from '@/portainer/hooks/useUser';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';
import { Button } from '@@/buttons';

import { EnvironmentIcon } from './EnvironmentIcon';
import { EdgeIndicator } from './EdgeIndicator';
import { EnvironmentStats } from './EnvironmentStats';
import styles from './EnvironmentItem.module.css';
import { EnvironmentStatusBadge } from './EnvironmentStatusBadge';

interface Props {
  environment: Environment;
  groupName?: string;
  onClick(environment: Environment): void;
}

export function EnvironmentItem({ environment, onClick, groupName }: Props) {
  const { isAdmin } = useUser();
  const isEdge = isEdgeEnvironment(environment.Type);

  const snapshotTime = getSnapshotTime(environment);

  const tags = useEnvironmentTagNames(environment.TagIds);
  const route = getRoute(environment);

  return (
    <div className={styles.root}>
      <button
        type="button"
        onClick={() => onClick(environment)}
        className={styles.wrapperButton}
      >
        <Link
          className={clsx('blocklist-item no-link', styles.item)}
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
                        environment={environment}
                        showLastCheckInDate
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
                {groupName && (
                  <span className="small space-right">
                    <span>Group: </span>
                    <span>{groupName}</span>
                  </span>
                )}
              </div>
              <EnvironmentStats environment={environment} />
              <div className="blocklist-item-line endpoint-item">
                <span className="small text-muted space-x-2">
                  {isDockerEnvironment(environment.Type) && (
                    <span>
                      {environment.Snapshots.length > 0 && (
                        <span className="small text-muted vertical-center">
                          <Cpu
                            className="icon icon-sm space-right"
                            aria-hidden="true"
                          />
                          {environment.Snapshots[0].TotalCPU} CPU
                          <Icon
                            icon="svg-memory"
                            className="icon icon-sm space-right"
                          />
                          {humanize(environment.Snapshots[0].TotalMemory)} RAM
                          <Cpu
                            className="icon icon-sm space-right"
                            aria-hidden="true"
                          />
                          {environment.Gpus?.length} GPU
                        </span>
                      )}
                    </span>
                  )}
                  <span className="vertical-center">
                    <Tag
                      className="icon icon-sm space-right"
                      aria-hidden="true"
                    />
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
      </button>
      {isAdmin && (
        <Link
          to="portainer.endpoints.endpoint"
          params={{ id: environment.Id }}
          className={styles.editButton}
        >
          <Button color="link">
            <Edit2 className="icon icon-md" aria-hidden="true" />
          </Button>
        </Link>
      )}
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
