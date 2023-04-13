import { Pod, PodList } from 'kubernetes-types/core/v1';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

export async function getPods(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<PodList>(
      buildUrl(environmentId, namespace)
    );
    return data.items;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve pods');
  }
}

export async function getPod(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  try {
    const { data } = await axios.get<Pod>(
      buildUrl(environmentId, namespace, name)
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve pod');
  }
}

export async function patchPod(
  environmentId: EnvironmentId,
  namespace: string,
  name: string,
  path: string,
  value: string
) {
  const payload = [
    {
      op: 'replace',
      path,
      value,
    },
  ];
  try {
    return await axios.put<Pod>(
      buildUrl(environmentId, namespace, name),
      payload
    );
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update pod');
  }
}

export function buildUrl(
  environmentId: EnvironmentId,
  namespace: string,
  name?: string
) {
  let baseUrl = `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/pods`;
  if (name) {
    baseUrl += `/${name}`;
  }
  return baseUrl;
}
