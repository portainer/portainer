import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { ContainerId } from '../../containers/types';
import { NetworkId } from '../types';

import { queryKeys } from './queryKeys';

export function useDisconnectContainer({
  environmentId,
  networkId,
}: {
  environmentId: EnvironmentId;
  networkId: NetworkId;
}) {
  const client = useQueryClient();

  return useMutation(
    ({ containerId }: { containerId: ContainerId }) =>
      disconnectContainer(environmentId, networkId, containerId),
    mutationOptions(
      withInvalidate(client, [queryKeys.item(environmentId, networkId)]),
      withError('Unable to disconnect container from network')
    )
  );
}

/**
 * Raw docker API proxy
 * @param environmentId
 * @param networkId
 * @param containerId
 * @returns
 */
export async function disconnectContainer(
  environmentId: EnvironmentId,
  networkId: NetworkId,
  containerId: ContainerId
) {
  try {
    await axios.post(
      buildDockerProxyUrl(environmentId, 'networks', networkId, 'disconnect'),
      {
        Container: containerId,
        Force: false,
      }
    );
    return { networkId, environmentId };
  } catch (err) {
    throw parseAxiosError(err, 'Unable to disconnect container from network');
  }
}
