import clsx from 'clsx';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import { Environment } from '@/portainer/environments/types';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import { PublicSettingsViewModel } from '@/portainer/models/settings';

interface Props {
  showLastCheckInDate?: boolean;
  environment: Environment;
}

export function EdgeIndicator({
  environment,

  showLastCheckInDate = false,
}: Props) {
  const associated = !!environment.EdgeID;

  const isValid = useHasHeartbeat(environment, associated);

  if (isValid === null) {
    return null;
  }

  if (!associated) {
    return (
      <span role="status" aria-label="edge-status">
        <span className="label label-default" aria-label="unassociated">
          <s>associated</s>
        </span>
      </span>
    );
  }

  return (
    <span role="status" aria-label="edge-status">
      <span
        className={clsx('label', {
          'label-danger': !isValid,
          'label-success': isValid,
        })}
        aria-label="edge-heartbeat"
      >
        heartbeat
      </span>

      {showLastCheckInDate && !!environment.LastCheckInDate && (
        <span
          className="space-left small text-muted"
          aria-label="edge-last-checkin"
        >
          {isoDateFromTimestamp(environment.LastCheckInDate)}
        </span>
      )}
    </span>
  );
}

function useHasHeartbeat(environment: Environment, associated: boolean) {
  const settingsQuery = usePublicSettings({ enabled: associated });

  if (!associated) {
    return false;
  }

  const { LastCheckInDate, QueryDate } = environment;

  const settings = settingsQuery.data;

  if (!settings) {
    return null;
  }

  const checkInInterval = getCheckinInterval(environment, settings);

  if (checkInInterval && QueryDate && LastCheckInDate) {
    return QueryDate - LastCheckInDate <= checkInInterval * 2 + 20;
  }

  return false;
}

function getCheckinInterval(
  environment: Environment,
  settings: PublicSettingsViewModel
) {
  const asyncMode = environment.Edge.AsyncMode;

  if (asyncMode) {
    const intervals = [
      environment.Edge.PingInterval > 0
        ? environment.Edge.PingInterval
        : settings.Edge.PingInterval,
      environment.Edge.SnapshotInterval > 0
        ? environment.Edge.SnapshotInterval
        : settings.Edge.SnapshotInterval,
      environment.Edge.CommandInterval > 0
        ? environment.Edge.CommandInterval
        : settings.Edge.CommandInterval,
    ].filter((n) => n > 0);

    return intervals.length > 0 ? Math.min(...intervals) : 60;
  }

  if (
    !environment.EdgeCheckinInterval ||
    environment.EdgeCheckinInterval === 0
  ) {
    return settings.Edge.CheckinInterval;
  }

  return environment.EdgeCheckinInterval;
}
