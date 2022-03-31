import { useQuery, useMutation, useQueryClient } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';
import {
  error as notifyError,
  success as notifySuccess,
} from '@/portainer/services/notifications';

import { ContainerId } from '../containers/types';

import {
  getNetwork,
  removeNetwork,
  disconnectContainer,
} from './network.service';
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

export function useDisconnectContainer(
  environmentId: EnvironmentId,
  networkId: NetworkId
) {
  const client = useQueryClient();

  return useMutation(
    ({ containerId }: { containerId: ContainerId }) =>
      disconnectContainer(environmentId, networkId, containerId),
    {
      onSuccess: () => {
        notifySuccess('Container successfully disconnected', networkId);
        return client.invalidateQueries([
          'environments',
          environmentId,
          'docker',
          'networks',
          networkId,
        ]);
      },
      onError: (err) => {
        notifyError(
          'Failure',
          err as Error,
          'Unable to disconnect container from network'
        );
      },
    }
  );
}
