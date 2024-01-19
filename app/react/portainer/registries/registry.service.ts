import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Catalog } from './types/registry';

export async function listRegistryCatalogs(registryId: number) {
  try {
    const { data } = await axios.get<Catalog>(
      `/registries/${registryId}/v2/_catalog`
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Failed to get catalog of registry');
  }
}
