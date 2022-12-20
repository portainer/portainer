import { History, Wifi, WifiOff } from 'lucide-react';

import { Environment } from '@/react/portainer/environments/types';
import {
  getDashboardRoute,
  isEdgeAsync as checkEdgeAsync,
} from '@/react/portainer/environments/utils';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Icon } from '@@/Icon';
import { LinkButton } from '@@/LinkButton';

type BrowseStatus = 'snapshot' | 'connected' | 'disconnected';

export function EnvironmentBrowseButtons({
  environment,
  onClickBrowse,
  isActive,
}: {
  environment: Environment;
  onClickBrowse(): void;
  isActive: boolean;
}) {
  const isEdgeAsync = checkEdgeAsync(environment);
  const browseStatus = getStatus(isActive, isEdgeAsync);
  return (
    <div className="flex flex-col gap-1 justify-center [&>*]:h-1/3 h-24">
      {isBE && (
        <LinkButton
          icon={History}
          disabled={!isEdgeAsync || browseStatus === 'snapshot'}
          to="edge.browse.dashboard"
          params={{
            environmentId: environment.Id,
          }}
          color="light"
          className="w-full !py-0 !m-0"
        >
          Browse snapshot
        </LinkButton>
      )}

      <LinkButton
        title="Live connection is not available for async environments"
        icon={Wifi}
        disabled={isEdgeAsync || browseStatus === 'connected'}
        to={getDashboardRoute(environment)}
        params={{
          endpointId: environment.Id,
        }}
        onClick={onClickBrowse}
        color="primary"
        className="w-full !py-0 !m-0"
      >
        Live connect
      </LinkButton>

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
    <div className="vertical-center justify-center opacity-50">
      <Icon icon={WifiOff} />
      Disconnected
    </div>
  );
}

function Connected() {
  return (
    <div className="vertical-center gap-2 justify-center text-green-8 bg-green-3 rounded-lg">
      <div className="rounded-full h-2 w-2 bg-green-8" />
      Connected
    </div>
  );
}

function Snapshot() {
  return (
    <div className="vertical-center gap-2 justify-center text-warning-7 bg-warning-3 rounded-lg">
      <div className="rounded-full h-2 w-2 bg-warning-7" />
      Browsing Snapshot
    </div>
  );
}
