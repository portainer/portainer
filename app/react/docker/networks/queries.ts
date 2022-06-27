import { useQuery, useMutation, useQueryClient } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';
import {
  error as notifyError,
  success as notifySuccess,
} from '@/portainer/services/notifications';
import { ContainerId } from '@/react/docker/containers/types';

import {
  getNetwork,
  deleteNetwork,
  disconnectContainer,
} from './network.service';
import { NetworkId } from './types';

export function useNetwork(environmentId: EnvironmentId, networkId: NetworkId) {
  return useQuery(
    ['environments', environmentId, 'docker', 'networks', networkId],
    () => getNetwork(environmentId, networkId),
    {
      onError: (err) => {
        notifyError('Failure', err as Error, 'Unable to get network');
      },
    }
  );
}

export function useDeleteNetwork() {
  return useMutation(
    ({
      environmentId,
      networkId,
    }: {
      environmentId: EnvironmentId;
      networkId: NetworkId;
    }) => deleteNetwork(environmentId, networkId),
    {
      onSuccess: (networkId) => {
        notifySuccess('Network successfully removed', networkId);
      },
      onError: (err) => {
        notifyError('Failure', err as Error, 'Unable to remove network');
      },
    }
  );
}

export function useDisconnectContainer() {
  const client = useQueryClient();

  return useMutation(
    ({
      containerId,
      environmentId,
      networkId,
    }: {
      containerId: ContainerId;
      environmentId: EnvironmentId;
      networkId: NetworkId;
    }) => disconnectContainer(environmentId, networkId, containerId),
    {
      onSuccess: ({ networkId, environmentId }) => {
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
