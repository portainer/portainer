import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { parseKubernetesAxiosError } from '../axiosError';

import { queryKeys as environmentQueryKeys } from './query-keys';

type ResourceYAMLParams = {
  environmentId: EnvironmentId;
  resourcePath: string;
  enabled?: boolean;
};

export function useResourceYAML({
  environmentId,
  resourcePath,
  enabled = true,
}: ResourceYAMLParams) {
  return useQuery({
    queryKey: [
      ...environmentQueryKeys.base(environmentId),
      'resource-yaml',
      resourcePath,
    ],
    queryFn: () => getResourceYAML(environmentId, resourcePath),
    enabled: enabled && !!resourcePath,
  });
}

async function getResourceYAML(
  environmentId: EnvironmentId,
  resourcePath: string
) {
  try {
    const { data: yaml } = await axios.get<string>(
      `/endpoints/${environmentId}/kubernetes/${resourcePath}`,
      {
        headers: {
          Accept: 'application/yaml',
        },
      }
    );

    return yaml;
  } catch (error) {
    throw parseKubernetesAxiosError(error, 'Unable to retrieve resource YAML');
  }
}
