import { useQuery } from '@tanstack/react-query';
import { Config } from 'docker-types/generated/1.41';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { ConfigViewModel } from '@/react/docker/configs/model';

import { queryKeys } from './queryKeys';
import { buildUrl } from './build-url';

export function useConfigsList(
  environmentId: EnvironmentId,
  { refetchInterval }: { refetchInterval?: number } = {}
) {
  return useQuery({
    queryKey: queryKeys.list(environmentId),
    queryFn: () => getConfigsList(environmentId),
    refetchInterval,
  });
}

async function getConfigsList(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<Array<Config>>(buildUrl(environmentId));
    return data.map((c) => new ConfigViewModel(c));
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve configs');
  }
}
