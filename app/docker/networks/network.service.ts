import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/portainer/environments/types';

import { NetworkId, DockerNetwork } from './types';

export async function getNetwork(
  environmentId: EnvironmentId,
  networkId: NetworkId
) {
  try {
    const { data: network } = await axios.get<DockerNetwork>(
      `${networksUrl(environmentId)}/${networkId}`
    );
    return network;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve network details');
  }
}

export async function removeNetwork(
  environmentId: EnvironmentId,
  networkId: NetworkId
) {
  try {
    await axios.delete(`${networksUrl(environmentId)}/${networkId}`);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to remove network');
  }
}

function networksUrl(environmentId: number): string {
  return `endpoints/${environmentId}/docker/networks`;
}
