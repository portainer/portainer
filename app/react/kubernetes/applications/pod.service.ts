import { Pod, PodList } from 'kubernetes-types/core/v1';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { ApplicationPatch } from './types';

export async function getNamespacePods(
  environmentId: EnvironmentId,
  namespace: string,
  labelSelector?: string
) {
  try {
    const { data } = await axios.get<PodList>(
      buildUrl(environmentId, namespace),
      {
        params: {
          labelSelector,
        },
      }
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
  patch: ApplicationPatch
) {
  try {
    return await axios.patch<Pod>(
      buildUrl(environmentId, namespace, name),
      patch,
      {
        headers: {
          'Content-Type': 'application/json-patch+json',
        },
      }
    );
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update pod');
  }
}

export async function deletePod(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  try {
    return await axios.delete<Pod>(buildUrl(environmentId, namespace, name));
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete pod');
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
