import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Namespaces } from './types';

export async function getNamespace(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: ingress } = await axios.get<Namespaces>(
      buildUrl(environmentId, namespace)
    );
    return ingress;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve network details');
  }
}

export async function getNamespaces(environmentId: EnvironmentId) {
  try {
    const { data: ingresses } = await axios.get<Namespaces>(
      buildUrl(environmentId)
    );
    return ingresses;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve network details');
  }
}

function buildUrl(environmentId: EnvironmentId, namespace?: string) {
  let url = `kubernetes/${environmentId}/namespaces`;

  if (namespace) {
    url += `/${namespace}`;
  }

  return url;
}
