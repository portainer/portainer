import { Wifi, WifiOff } from 'react-feather';

import ClockRewind from '@/assets/ico/clock-rewind.svg?c';
import { Environment } from '@/react/portainer/environments/types';
import {
  getDashboardRoute,
  isEdgeAsync as checkEdgeAsync,
} from '@/react/portainer/environments/utils';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Icon } from '@@/Icon';
import { LinkButton } from '@@/LinkButton';

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

  return (
    <div className="flex flex-col gap-1 ml-auto [&>*]:flex-1">
      {isBE && (
        <LinkButton
          icon={ClockRewind}
          disabled={!isEdgeAsync}
          to="edge.browse.dashboard"
          params={{
            environmentId: environment.Id,
          }}
          color="light"
          className="w-full py-1"
        >
          Browse snapshot
        </LinkButton>
      )}

      <LinkButton
        icon={Wifi}
        disabled={isEdgeAsync}
        to={getDashboardRoute(environment)}
        params={{
          endpointId: environment.Id,
        }}
        onClick={onClickBrowse}
        color="primary"
        className="w-full py-1"
      >
        Live connect
      </LinkButton>

      {!isActive ? (
        <div className="min-h-[30px] vertical-center justify-center">
          <Icon icon={WifiOff} />
          Disconnected
        </div>
      ) : (
        <div className="min-h-[30px]" />
      )}
    </div>
  );
}
