import { useQuery } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';

import { getNetwork } from './network.service';
import { NetworkId } from './types';

export function useNetwork(networkId: NetworkId, environmentId: EnvironmentId) {
  return useQuery(
    networkId && ['network', networkId, 'environmentId', environmentId],
    () => getNetwork(networkId, environmentId)
  );
}

// useDeleteNetwork
