import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Configuration } from './types';

// returns the formatted list of configmaps and secrets
export async function getConfigurations(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: configmaps } = await axios.get<Configuration[]>(
      `kubernetes/${environmentId}/namespaces/${namespace}/configuration`
    );
    return configmaps;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve configmaps');
  }
}

export async function getConfigMapsForCluster(
  environmentId: EnvironmentId,
  namespaces: string[]
) {
  try {
    const configmaps = await Promise.all(
      namespaces.map((namespace) => getConfigurations(environmentId, namespace))
    );
    return configmaps.flat();
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve ConfigMaps for cluster'
    );
  }
}
