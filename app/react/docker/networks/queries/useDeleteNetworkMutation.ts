import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { withAgentTargetHeader } from '../../proxy/queries/utils';
import { NetworkId } from '../types';

import { queryKeys } from './queryKeys';

export function useDeleteNetwork(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      networkId,
      nodeName,
    }: {
      networkId: NetworkId;
      nodeName?: string;
    }) => deleteNetwork(environmentId, networkId, { nodeName }),
    ...withError('Unable to remove network'),
    onSuccess(_, { networkId }) {
      queryClient.cancelQueries(queryKeys.item(environmentId, networkId));
      return queryClient.invalidateQueries(queryKeys.base(environmentId));
    },
  });
}

/**
 * Raw docker API proxy
 * @param environmentId
 * @param networkId
 * @returns
 */
export async function deleteNetwork(
  environmentId: EnvironmentId,
  networkId: NetworkId,
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    await axios.delete(
      buildDockerProxyUrl(environmentId, 'networks', networkId),
      {
        headers: { ...withAgentTargetHeader(nodeName) },
      }
    );
    return networkId;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to remove network');
  }
}
