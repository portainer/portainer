import clsx from 'clsx';

import {
  Environment,
  EnvironmentStatus,
} from '@/react/portainer/environments/types';
import { isEdgeEnvironment } from '@/react/portainer/environments/utils';

interface Props {
  environment: Environment;
}

export function EnvironmentStatusBadge({ environment }: Props) {
  if (isEdgeEnvironment(environment.Type)) {
    return (
      <EnvironmentStatusBadgeComponent
        color={environment.Heartbeat ? 'success' : 'danger'}
        text={environment.Heartbeat ? 'Heartbeat' : 'Down'}
        heartbeat={environment.Heartbeat}
      />
    );
  }

  return environment.Status === EnvironmentStatus.Up ? (
    <EnvironmentStatusBadgeComponent color="success" text="Up" />
  ) : (
    <EnvironmentStatusBadgeComponent color="danger" text="Down" />
  );
}

function EnvironmentStatusBadgeComponent({
  color,
  text,
  heartbeat,
}: {
  color: 'danger' | 'success';
  text: string;
  heartbeat?: boolean;
}) {
  return (
    <span
      className={clsx(
        'flex items-center gap-2 rounded-xl',
        'w-fit px-2 py-px',
        'text-xs font-bold',
        {
          'bg-success-7/20 text-success-7': color === 'success',
          'bg-error-7/20 text-error-7': color === 'danger',
        }
      )}
      aria-label="status-badge"
    >
      <span
        aria-hidden="true"
        className={clsx(
          'block h-2 w-2 rounded-full',
          { 'animate-pulse': heartbeat },
          {
            'bg-success-7': color === 'success',
            'bg-error-7': color === 'danger',
          }
        )}
      />
      <span>{text}</span>
    </span>
  );
}
