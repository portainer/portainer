import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { Stack, StackId } from '../types';

import { queryKeys } from './query-keys';
import { buildStackUrl } from './buildUrl';

export function useStack<T = Stack>(
  stackId?: StackId,
  queryOptions?: UseQueryOptions<Stack, unknown, T>
) {
  return useQuery({
    queryKey: queryKeys.stack(stackId),
    queryFn: () => getStack(stackId),
    enabled: !!stackId,
    ...withError('Unable to retrieve stack'),
    ...queryOptions,
  });
}

async function getStack(stackId?: StackId) {
  if (!stackId) {
    throw new Error('Stack ID is required');
  }
  try {
    const { data } = await axios.get<Stack>(buildStackUrl(stackId));
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve stack');
  }
}
