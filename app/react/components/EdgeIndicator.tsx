import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import { useHasHeartbeat } from '@/react/edge/hooks/useHasHeartbeat';
import { Environment } from '@/react/portainer/environments/types';

import { EnvironmentStatusBadgeItem } from './EnvironmentStatusBadgeItem';

interface Props {
  showLastCheckInDate?: boolean;
  environment: Environment;
}

export function EdgeIndicator({
  environment,

  showLastCheckInDate = false,
}: Props) {
  const isValid = useHasHeartbeat(environment);

  if (isValid === null) {
    return null;
  }

  const associated = !!environment.EdgeID;
  if (!associated) {
    return (
      <span role="status" aria-label="edge-status">
        <EnvironmentStatusBadgeItem aria-label="unassociated">
          <s>associated</s>
        </EnvironmentStatusBadgeItem>
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label="edge-status"
      className="flex items-center gap-1"
    >
      <EnvironmentStatusBadgeItem
        color={isValid ? 'success' : 'danger'}
        icon="fa-heartbeat"
        aria-label="edge-heartbeat"
      >
        heartbeat
      </EnvironmentStatusBadgeItem>

      {showLastCheckInDate && !!environment.LastCheckInDate && (
        <span className="small text-muted" aria-label="edge-last-checkin">
          {isoDateFromTimestamp(environment.LastCheckInDate)}
        </span>
      )}
    </span>
  );
}
