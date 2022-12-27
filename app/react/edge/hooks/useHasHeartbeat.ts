import { Environment } from '@/react/portainer/environments/types';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import { PublicSettingsResponse } from '@/react/portainer/settings/types';

export function useHasHeartbeat(environment: Environment) {
  const associated = !!environment.EdgeID;

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
  settings: PublicSettingsResponse
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
