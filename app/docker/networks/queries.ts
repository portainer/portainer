import { useQuery } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';

import { getNetwork } from './network.service';
import { NetworkId } from './types';

export function useNetwork(environmentId: EnvironmentId, networkId: NetworkId) {
  return useQuery(
    ['environmentId', environmentId, 'network', networkId],
    () => getNetwork(networkId, environmentId),
    {
      onError: (err) => {
        // if there's an error fetching the network, tell the user
        notifyError('Failure', err as Error, 'Unable to get network');
      },
    }
  );
}

// useDeleteNetwork
