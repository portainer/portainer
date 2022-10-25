import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Namespaces } from './types';

export async function getNamespace(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: ns } = await axios.get<Namespaces>(
      buildUrl(environmentId, namespace)
    );
    return ns;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve namespace');
  }
}

export async function getNamespaces(environmentId: EnvironmentId) {
  try {
    const { data: namespaces } = await axios.get<Namespaces>(
      buildUrl(environmentId)
    );
    return namespaces;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve namespaces');
  }
}

function buildUrl(environmentId: EnvironmentId, namespace?: string) {
  let url = `kubernetes/${environmentId}/namespaces`;

  if (namespace) {
    url += `/${namespace}`;
  }

  return url;
}
