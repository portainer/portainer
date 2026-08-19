import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { queryKeys as environmentQueryKeys } from '@/react/kubernetes/queries/query-keys';
import axios from '@/portainer/services/axios/axios';

import { parseKubernetesAxiosError } from '../../../axiosError';

export function useSecretYAML(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  return useQuery(
    [
      ...environmentQueryKeys.base(environmentId),
      'secrets',
      namespace,
      name,
      'yaml',
    ],
    () => getSecretYAML(environmentId, namespace, name),
    { enabled: !!namespace && !!name }
  );
}

async function getSecretYAML(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  try {
    const { data } = await axios.get<string>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/secrets/${name}`,
      { headers: { Accept: 'application/yaml' } }
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve secret YAML');
  }
}
