import { Activity } from 'lucide-react';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import { Environment } from '@/react/portainer/environments/types';
import heartbeatup from '@/assets/ico/heartbeat-up.svg?c';
import heartbeatdown from '@/assets/ico/heartbeat-down.svg?c';

import { EnvironmentStatusBadgeItem } from './EnvironmentStatusBadgeItem';

interface Props {
  showLastCheckInDate?: boolean;
  environment: Environment;
}

export function EdgeIndicator({
  environment,
  showLastCheckInDate = false,
}: Props) {
  const heartbeat = environment.Heartbeat;

  const associated = !!environment.EdgeID;
  if (!associated) {
    return (
      <span role="status" aria-label="edge-status">
        <EnvironmentStatusBadgeItem aria-label="unassociated">
          <span className="whitespace-nowrap">Not associated</span>
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
        color={heartbeat ? 'success' : 'danger'}
        icon={heartbeat ? heartbeatup : heartbeatdown}
        aria-label="edge-heartbeat"
      >
        heartbeat
      </EnvironmentStatusBadgeItem>

      {showLastCheckInDate && !!environment.LastCheckInDate && (
        <span
          className="small text-muted vertical-center"
          aria-label="edge-last-checkin"
          title="Last edge check-in"
        >
          <Activity className="icon icon-sm space-right" aria-hidden="true" />
          {isoDateFromTimestamp(environment.LastCheckInDate)}
        </span>
      )}
    </span>
  );
}
