import { Clock } from 'lucide-react';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import {
  type Environment,
  PlatformType,
} from '@/react/portainer/environments/types';
import {
  getDashboardRoute,
  getPlatformType,
  isEdgeEnvironment,
  isSnapshotBrowsingSupported,
} from '@/react/portainer/environments/utils';
import { EnvironmentURL } from '@/react/portainer/HomeView/EnvironmentList/EnvironmentItem/EnvironmentURL';
import { EnvironmentGroupName } from '@/react/portainer/HomeView/EnvironmentList/EnvironmentItem/EnvironmentGroupName';
import { EnvironmentStats } from '@/react/portainer/HomeView/EnvironmentList/EnvironmentItem/EnvironmentStats';
import { AgentDetails } from '@/react/portainer/HomeView/EnvironmentList/EnvironmentItem/AgentDetails';
import { EnvironmentTypeTag } from '@/react/portainer/HomeView/EnvironmentList/EnvironmentItem/EnvironmentTypeTag';

import { SnapshotBadge } from '@@/SnapshotBadge';
import { EdgeIndicator } from '@@/EdgeIndicator';
import { EnvironmentStatusBadge } from '@@/EnvironmentStatusBadge';
import { Link } from '@@/Link';
import { BlocklistItem } from '@@/Blocklist/BlocklistItem';

import { EnvironmentIcon } from './EnvironmentIcon';
import { EngineVersion } from './EngineVersion';
import { EditButtons } from './EditButtons';

interface Props {
  environment: Environment;
  groupName?: string;

  onClickBrowse(): void;
}

export function EnvironmentCard({
  environment,
  groupName,
  onClickBrowse,
}: Props) {
  const isEdge = isEdgeEnvironment(environment.Type);

  const snapshotTime = getSnapshotTime(environment);
  const dashboardRoute = getDashboardRoute(environment);
  const hasDashboardRoute = !!dashboardRoute.to;
  const showSnapshotButton =
    isSnapshotBrowsingSupported(environment) &&
    !environment.Heartbeat &&
    environment.Snapshots.length > 0;

  return (
    <div className="relative border-0 border-b border-solid border-gray-5 th-highcontrast:border-white th-dark:border-gray-9">
      <BlocklistItem
        as={hasDashboardRoute ? Link : 'button'}
        className="!m-0 flex flex-wrap gap-4 !border-none !pr-14"
        onClick={hasDashboardRoute ? onClickBrowse : undefined}
        aria-disabled={!hasDashboardRoute}
        to={dashboardRoute.to}
        params={dashboardRoute.params}
        data-cy={`environment-card-${environment.Name}`}
      >
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="flex items-center justify-center self-center rounded-lg bg-blue-9/10 p-2 pt-2">
            <EnvironmentIcon
              type={environment.Type}
              containerEngine={environment.ContainerEngine}
            />
          </div>

          <div className="flex min-w-0 flex-1 grow flex-col gap-1">
            {/* First row - title */}
            <div className="flex items-center gap-2">
              <span className="break-words text-sm font-bold">
                {environment.Name}
              </span>
              <EnvironmentStatusBadge environment={environment} />
              {showSnapshotButton && <SnapshotBadge />}
            </div>
            {/* Middle row - status info */}
            <div className="flex items-center gap-2">
              {isEdge ? (
                <EdgeIndicator environment={environment} showLastCheckInDate />
              ) : (
                <>
                  {snapshotTime && (
                    <span
                      className="small text-muted vertical-center gap-1"
                      title="Last snapshot time"
                    >
                      <Clock className="icon icon-sm" aria-hidden="true" />
                      {snapshotTime} •
                    </span>
                  )}
                </>
              )}
              <EngineVersion environment={environment} />
              <span className="small text-muted vertical-center">•</span>
              <EnvironmentURL environment={environment} />
            </div>
            <div className="flex items-center gap-2">
              <EnvironmentGroupName groupName={groupName} />
              <EnvironmentTypeTag environment={environment} />
              <AgentDetails environment={environment} />
            </div>
          </div>
        </div>
        <EnvironmentStats environment={environment} />
      </BlocklistItem>
      {/*
      Buttons are extracted out of the main button because it causes errors with react and accessibility issues
      see https://stackoverflow.com/questions/66409964/warning-validatedomnesting-a-cannot-appear-as-a-descendant-of-a
      */}
      <div className="absolute inset-y-0 right-0 flex w-56 justify-end">
        <EditButtons environment={environment} />
      </div>
    </div>
  );
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
