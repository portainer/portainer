import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { Stack } from '@/react/common/stacks/types';

import { buildStackUrl } from './buildUrl';
import { queryKeys } from './query-keys';

export function useStacks() {
  return useQuery(queryKeys.base(), () => getStacks(), {
    ...withError('Failed loading stack'),
  });
}

export async function getStacks() {
  try {
    const { data } = await axios.get<Stack[]>(buildStackUrl());
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
