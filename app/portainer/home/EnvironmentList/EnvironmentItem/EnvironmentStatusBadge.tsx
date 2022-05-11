import clsx from 'clsx';

import { EnvironmentStatus } from '@/portainer/environments/types';

interface Props {
  status: EnvironmentStatus;
}

export function EnvironmentStatusBadge({ status }: Props) {
  return (
    <span className={clsx('label', `label-${environmentStatusBadge(status)}`)}>
      {status === EnvironmentStatus.Up ? 'up' : 'down'}
    </span>
  );
}

function environmentStatusBadge(status: EnvironmentStatus) {
  if (status === EnvironmentStatus.Down) {
    return 'danger';
  }
  return 'success';
}
