import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { DockerNetwork, NetworkId } from '../types';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { withAgentTargetHeader } from '../../proxy/queries/utils';

import { queryKeys } from './queryKeys';

export function useNetwork(
  environmentId: EnvironmentId,
  networkId: NetworkId,
  { nodeName }: { nodeName?: string } = {}
) {
  return useQuery(
    [...queryKeys.item(environmentId, networkId), { nodeName }],
    () => getNetwork(environmentId, networkId, { nodeName }),
    {
      ...withGlobalError('Unable to get network'),
    }
  );
}

/**
 * Raw docker API proxy
 * @param environmentId
 * @param networkId
 * @param param2
 * @returns
 */
export async function getNetwork(
  environmentId: EnvironmentId,
  networkId: NetworkId,
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    const { data: network } = await axios.get<DockerNetwork>(
      buildDockerProxyUrl(environmentId, 'networks', networkId),
      {
        headers: {
          ...withAgentTargetHeader(nodeName),
        },
      }
    );
    return network;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve network details');
  }
}
