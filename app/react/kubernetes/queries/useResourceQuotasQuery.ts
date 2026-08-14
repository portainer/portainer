import { ResourceQuotaList } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

import { parseKubernetesAxiosError } from '../axiosError';

// useResourceQuotaQuery is used to retrieve the resource quota for a namespace
export function useResourceQuotasQuery(
  environmentId: EnvironmentId,
  namespace?: string
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'resource_quota', namespace],
    () => getResourceQuotas(environmentId, namespace),
    {
      enabled: !!namespace,
      ...withError(`Unable to get resource quotas the namespace ${namespace}.`),
    }
  );
}

// getResource Quotas gets all resource quotas in a given namespace using the kubernetes proxy
export async function getResourceQuotas(
  environmentId: EnvironmentId,
  namespace?: string
) {
  if (!namespace) {
    return [];
  }
  try {
    const { data: resourceQuotaList } = await axios.get<ResourceQuotaList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/resourcequotas`
    );
    return resourceQuotaList.items;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve resource quota');
  }
}
