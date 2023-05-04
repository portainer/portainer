import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Ingress, DeleteIngressesRequest, IngressController } from './types';

export async function getIngress(
  environmentId: EnvironmentId,
  namespace: string,
  ingressName: string
) {
  try {
    const { data: ingress } = await axios.get<Ingress[]>(
      buildUrl(environmentId, namespace, ingressName)
    );
    return ingress[0];
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve the ingress');
  }
}

export async function getIngresses(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: ingresses } = await axios.get<Ingress[]>(
      buildUrl(environmentId, namespace)
    );
    return ingresses;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve ingresses');
  }
}

export async function getIngressControllers(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: ingresscontrollers } = await axios.get<IngressController[]>(
      `kubernetes/${environmentId}/namespaces/${namespace}/ingresscontrollers`
    );
    return ingresscontrollers;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve ingresses');
  }
}

export async function createIngress(
  environmentId: EnvironmentId,
  ingress: Ingress
) {
  try {
    return await axios.post(
      buildUrl(environmentId, ingress.Namespace),
      ingress
    );
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to create an ingress');
  }
}

export async function updateIngress(
  environmentId: EnvironmentId,
  ingress: Ingress
) {
  try {
    return await axios.put(buildUrl(environmentId, ingress.Namespace), ingress);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update an ingress');
  }
}

export async function deleteIngresses(
  environmentId: EnvironmentId,
  data: DeleteIngressesRequest
) {
  try {
    return await axios.post(
      `kubernetes/${environmentId}/ingresses/delete`,
      data
    );
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete ingresses');
  }
}

function buildUrl(
  environmentId: EnvironmentId,
  namespace: string,
  ingressName?: string
) {
  let url = `kubernetes/${environmentId}/namespaces/${namespace}/ingresses`;

  if (ingressName) {
    url += `/${ingressName}`;
  }

  return url;
}
