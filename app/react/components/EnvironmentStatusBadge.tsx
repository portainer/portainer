import { CheckCircle, XCircle } from 'lucide-react';

import { EnvironmentStatus } from '@/react/portainer/environments/types';

import { EnvironmentStatusBadgeItem } from './EnvironmentStatusBadgeItem';

interface Props {
  status: EnvironmentStatus;
}

export function EnvironmentStatusBadge({ status }: Props) {
  return status === EnvironmentStatus.Up ? (
    <EnvironmentStatusBadgeItem color="success" icon={CheckCircle}>
      Up
    </EnvironmentStatusBadgeItem>
  ) : (
    <EnvironmentStatusBadgeItem color="danger" icon={XCircle}>
      Down
    </EnvironmentStatusBadgeItem>
  );
}
