import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { isFulfilled } from '@/portainer/helpers/promise-utils';

import { parseKubernetesAxiosError } from '../../axiosError';
import { getResourceQuotas } from '../../queries/useResourceQuotasQuery';

import { queryKeys } from './queryKeys';

/**
 * Gets the YAML for a namespace and every resource quota it contains directly from the K8s proxy API.
 */
export function useNamespaceYAML(
  environmentId: EnvironmentId,
  namespaceName: string
) {
  return useQuery({
    queryKey: queryKeys.namespaceYAML(environmentId, namespaceName),
    queryFn: () => composeNamespaceYAML(environmentId, namespaceName),
  });
}

async function composeNamespaceYAML(
  environmentId: EnvironmentId,
  namespace: string
) {
  const settledPromises = await Promise.allSettled([
    getNamespaceYAML(environmentId, namespace).then((yaml) => [yaml]),
    getResourceQuotasYAML(environmentId, namespace),
  ]);
  const resolvedPromises = settledPromises.filter(isFulfilled);
  return resolvedPromises.flatMap((p) => p.value).join('\n---\n');
}

async function getNamespaceYAML(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: yaml } = await axios.get<string>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}`,
      {
        headers: {
          Accept: 'application/yaml',
        },
      }
    );
    return yaml;
  } catch (error) {
    throw parseKubernetesAxiosError(error, 'Unable to retrieve namespace YAML');
  }
}

/**
 * Gets the YAML for every resource quota in the namespace, not just the Portainer managed one.
 * The list call only returns JSON, so each quota is fetched separately to get it as its own YAML document.
 */
async function getResourceQuotasYAML(
  environmentId: EnvironmentId,
  namespace: string
) {
  const resourceQuotas = await getResourceQuotas(environmentId, namespace);
  const names = resourceQuotas.flatMap((quota) => quota.metadata?.name ?? []);
  const settledPromises = await Promise.allSettled(
    names.map((name) => getResourceQuotaYAML(environmentId, namespace, name))
  );
  return settledPromises.filter(isFulfilled).map((p) => p.value);
}

async function getResourceQuotaYAML(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  try {
    const { data: yaml } = await axios.get<string>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/resourcequotas/${name}`,
      { headers: { Accept: 'application/yaml' } }
    );
    return yaml;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      `Unable to retrieve resource quota ${name} YAML`
    );
  }
}
