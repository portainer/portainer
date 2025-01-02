import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { isFulfilled } from '@/portainer/helpers/promise-utils';

import { parseKubernetesAxiosError } from '../../axiosError';
import { generateResourceQuotaName } from '../resourceQuotaUtils';

import { queryKeys } from './queryKeys';

/**
 * Gets the YAML for a namespace and its resource quota directly from the K8s proxy API.
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
    getNamespaceYAML(environmentId, namespace),
    getResourceQuotaYAML(environmentId, namespace),
  ]);
  const resolvedPromises = settledPromises.filter(isFulfilled);
  return resolvedPromises.map((p) => p.value).join('\n---\n');
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

async function getResourceQuotaYAML(
  environmentId: EnvironmentId,
  namespace: string
) {
  const resourceQuotaName = generateResourceQuotaName(namespace);
  try {
    const { data: yaml } = await axios.get<string>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/resourcequotas/${resourceQuotaName}`,
      { headers: { Accept: 'application/yaml' } }
    );
    return yaml;
  } catch (e) {
    // silently ignore if resource quota does not exist
    return null;
  }
}
