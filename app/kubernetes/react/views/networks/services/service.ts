import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/portainer/environments/types';

import { Service } from './types';

export async function getServices(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: services } = await axios.get<Service[]>(
      buildUrl(environmentId, namespace)
    );
    return services;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve services');
  }
}

function buildUrl(environmentId: EnvironmentId, namespace: string) {
  const url = `kubernetes/${environmentId}/namespaces/${namespace}/services`;
  return url;
}
