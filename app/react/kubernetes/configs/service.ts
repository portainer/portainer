import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/portainer/environments/types';

import { Configuration } from './types';

export async function getConfigMaps(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: configmaps } = await axios.get<Configuration[]>(
      `kubernetes/${environmentId}/namespaces/${namespace}/configmaps`
    );
    return configmaps;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve configmaps');
  }
}
