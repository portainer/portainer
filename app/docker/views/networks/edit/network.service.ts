import axios, { parseAxiosError } from '@/portainer/services/axios';

import { NetworkId } from './types';

const systemNetworks: string[] = ['host', 'bridge', 'none'];

export function isSystemNetwork(networkName: string): boolean {
  return systemNetworks.includes(networkName);
}

export async function getNetwork(networkId: NetworkId, environmentId: string) {
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
  environmentId: string
) {
  try {
    const response = await axios.delete(
      `${networksUrl(environmentId)}/${networkId}`
    );
    console.log(response);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve network details');
  }
}

function networksUrl(environmentId: string): string {
  return `endpoints/${environmentId}/docker/networks`;
}
