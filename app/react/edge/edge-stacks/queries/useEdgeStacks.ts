import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { EdgeStack } from '../types';

import { buildUrl } from './buildUrl';
import { queryKeys } from './query-keys';

type QueryParams = {
  summarizeStatuses?: boolean;
};

export function useEdgeStacks<T extends EdgeStack[] = EdgeStack[]>({
  params,
  refetchInterval,
}: {
  params?: QueryParams;
  refetchInterval?: number | false | ((data?: T) => false | number);
} = {}) {
  return useQuery({
    queryKey: queryKeys.base(),
    queryFn: () => getEdgeStacks<T>(params),
    refetchInterval,
    ...withError('Failed loading Edge stack'),
  });
}

async function getEdgeStacks<T extends EdgeStack[] = EdgeStack[]>(
  params: QueryParams = {}
) {
  try {
    const { data } = await axios.get<T>(buildUrl(), { params });
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
