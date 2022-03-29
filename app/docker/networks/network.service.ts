import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/portainer/environments/types';

import { NetworkId } from './types';

const systemNetworks: string[] = ['host', 'bridge', 'none'];

export function isSystemNetwork(networkName: string): boolean {
  return systemNetworks.includes(networkName);
}

export async function getNetwork(
  networkId: NetworkId,
  environmentId: EnvironmentId
) {
  try {
    const { data: network } = await axios.get(
      `${networksUrl(environmentId)}/${networkId}`
    );
    return network;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve network details');
  }
}

export async function removeNetwork(
  networkId: NetworkId,
  environmentId: EnvironmentId
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
