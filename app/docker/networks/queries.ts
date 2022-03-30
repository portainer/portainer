import { useQuery, useMutation, useQueryClient } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';
import {
  error as notifyError,
  success as notifySuccess,
} from '@/portainer/services/notifications';

import { getNetwork, removeNetwork } from './network.service';
import { NetworkId } from './types';

export function useNetwork(environmentId: EnvironmentId, networkId: NetworkId) {
  return useQuery(
    ['environmentId', environmentId, 'network', networkId],
    () => getNetwork(environmentId, networkId),
    {
      onError: (err) => {
        // if there's an error fetching the network, tell the user
        notifyError('Failure', err as Error, 'Unable to get network');
      },
    }
  );
}

// useDeleteNetwork
export function UseDeleteNetwork(
  environmentId: EnvironmentId,
  networkId: NetworkId
) {
  const queryClient = useQueryClient();

  return useMutation(() => removeNetwork(environmentId, networkId), {
    onSuccess: () => {
      notifySuccess('Network successfully removed', networkId);
      queryClient.invalidateQueries([
        'environmentId',
        environmentId,
        'network',
      ]);
    },
    onError: (err) => {
      notifyError('Failure', err as Error, 'Unable to remove network');
    },
  });
}
