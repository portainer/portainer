import { useQuery, useMutation } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';
import {
  error as notifyError,
  success as notifySuccess,
} from '@/portainer/services/notifications';

import { getNetwork, removeNetwork } from './network.service';
import { NetworkId } from './types';

export function useNetwork(environmentId: EnvironmentId, networkId: NetworkId) {
  return useQuery(
    ['environments', environmentId, 'docker', 'networks', networkId],
    () => getNetwork(environmentId, networkId),
    {
      onError: (err) => {
        // if there's an error fetching the network, tell the user
        notifyError('Failure', err as Error, 'Unable to get network');
      },
    }
  );
}

export function useDeleteNetwork(
  environmentId: EnvironmentId,
  networkId: NetworkId
) {
  return useMutation(
    ({
      environmentId,
      networkId,
    }: {
      environmentId: EnvironmentId;
      networkId: NetworkId;
    }) => removeNetwork(environmentId, networkId),
    {
      onSuccess: () => {
        notifySuccess('Network successfully removed', networkId);
      },
      onError: (err) => {
        notifyError('Failure', err as Error, 'Unable to remove network');
      },
    }
  );
}
