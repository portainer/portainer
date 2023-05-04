import { EnvironmentId } from '@/react/portainer/environments/types';
import PortainerError from '@/portainer/error';
import axios from '@/portainer/services/axios';

import { IngressControllerClassMap } from '../types';

// get all supported ingress classes and controllers for the cluster
// allowedOnly set to true will hide globally disallowed ingresscontrollers
export async function getIngressControllerClassMap({
  environmentId,
  namespace,
  allowedOnly,
}: {
  environmentId: EnvironmentId;
  namespace?: string;
  allowedOnly?: boolean;
}) {
  try {
    const { data: controllerMaps } = await axios.get<
      IngressControllerClassMap[]
    >(
      buildUrl(environmentId, namespace),
      allowedOnly ? { params: { allowedOnly: true } } : undefined
    );
    return controllerMaps;
  } catch (e) {
    throw new PortainerError('Unable to get ingress controllers.', e as Error);
  }
}

// get all supported ingress classes and controllers for the cluster
export async function updateIngressControllerClassMap(
  environmentId: EnvironmentId,
  ingressControllerClassMap: IngressControllerClassMap[],
  namespace?: string
) {
  try {
    const { data: controllerMaps } = await axios.put<
      IngressControllerClassMap[]
    >(buildUrl(environmentId, namespace), ingressControllerClassMap);
    return controllerMaps;
  } catch (e) {
    throw new PortainerError(
      'Unable to update ingress controllers.',
      e as Error
    );
  }
}

function buildUrl(environmentId: EnvironmentId, namespace?: string) {
  let url = `kubernetes/${environmentId}/`;
  if (namespace) {
    url += `namespaces/${namespace}/`;
  }
  url += 'ingresscontrollers';
  return url;
}
