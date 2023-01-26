import { History, Wifi, WifiOff, X } from 'lucide-react';
import clsx from 'clsx';

import { Environment } from '@/react/portainer/environments/types';
import {
  getDashboardRoute,
  isEdgeAsync as checkEdgeAsync,
} from '@/react/portainer/environments/utils';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Icon } from '@@/Icon';
import { LinkButton } from '@@/LinkButton';
import { Button } from '@@/buttons';

type BrowseStatus = 'snapshot' | 'connected' | 'disconnected';

export function EnvironmentBrowseButtons({
  environment,
  onClickBrowse,
  onClickDisconnect,
  isActive,
}: {
  environment: Environment;
  onClickBrowse(): void;
  onClickDisconnect(): void;
  isActive: boolean;
}) {
  const isEdgeAsync = checkEdgeAsync(environment);
  const browseStatus = getStatus(isActive, isEdgeAsync);

  const dashboardRoute = getDashboardRoute(environment);
  return (
    <div className="flex flex-col gap-2 justify-center [&>*]:h-1/3 h-24 w-full">
      {isBE &&
        (browseStatus !== 'snapshot' ? (
          <LinkButton
            icon={History}
            disabled={!isEdgeAsync}
            to="edge.browse.dashboard"
            params={{
              environmentId: environment.Id,
            }}
            size="medium"
            color="light"
            className="w-full !py-0 !m-0"
          >
            Browse snapshot
          </LinkButton>
        ) : (
          <Button
            icon={X}
            onClick={onClickDisconnect}
            className="w-full !py-0 !m-0 opacity-60"
            size="medium"
            color="light"
          >
            Close snapshot
          </Button>
        ))}

      {browseStatus !== 'connected' ? (
        <LinkButton
          title="Live connection is not available for async environments"
          icon={Wifi}
          disabled={isEdgeAsync}
          to={dashboardRoute.to}
          params={dashboardRoute.params}
          size="medium"
          onClick={onClickBrowse}
          color="primary"
          className="w-full !py-0 !m-0"
        >
          Live connect
        </LinkButton>
      ) : (
        <Button
          icon={WifiOff}
          onClick={onClickDisconnect}
          className="w-full !py-0 !m-0 opacity-60"
          size="medium"
          color="primary"
        >
          Disconnect
        </Button>
      )}

      <BrowseStatusTag status={browseStatus} />
    </div>
  );
}

function getStatus(isActive: boolean, isEdgeAsync: boolean) {
  if (!isActive) {
    return 'disconnected';
  }

  if (isEdgeAsync) {
    return 'snapshot';
  }

  return 'connected';
}

function BrowseStatusTag({ status }: { status: BrowseStatus }) {
  switch (status) {
    case 'snapshot':
      return <Snapshot />;
    case 'connected':
      return <Connected />;
    case 'disconnected':
      return <Disconnected />;
    default:
      return null;
  }
}

function Disconnected() {
  return (
    <div className="flex items-center gap-2 justify-center">
      <Icon icon={WifiOff} />
      Disconnected
    </div>
  );
}

function Connected() {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 justify-center rounded-lg',
        'text-green-8 th-dark:text-green-4',
        'bg-green-3 th-dark:bg-green-3/30'
      )}
    >
      <div className="rounded-full h-2 w-2 bg-green-8 th-dark:bg-green-4" />
      Connected
    </div>
  );
}

function Snapshot() {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 justify-center rounded-lg',
        'text-warning-7 th-dark:text-warning-4',
        'bg-warning-3 th-dark:bg-warning-3/10 th-highcontrast:bg-warning-3/30'
      )}
    >
      <div className="rounded-full h-2 w-2 bg-warning-7" />
      Browsing Snapshot
    </div>
  );
}
