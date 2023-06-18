import { useCurrentStateAndParams } from '@uirouter/react';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { useLogsStatus } from './useLogsStatus';

interface Props {
  environmentId: EnvironmentId;
}

export function ActionStatus({ environmentId }: Props) {
  const {
    params: { stackId: edgeStackId },
  } = useCurrentStateAndParams();

  const logsStatusQuery = useLogsStatus(edgeStackId, environmentId);

  return <>{getStatusText(logsStatusQuery.data)}</>;
}

function getStatusText(status?: 'pending' | 'collected' | 'idle') {
  switch (status) {
    case 'collected':
      return 'Logs available for download';
    case 'pending':
      return 'Logs marked for collection, please wait until the logs are available';
    default:
      return null;
  }
}
