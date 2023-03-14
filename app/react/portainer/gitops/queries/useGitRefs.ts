import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

interface RefsPayload {
  repository: string;
  username?: string;
  password?: string;
  tlsSkipVerify?: boolean;
}

export function useGitRefs<T = string[]>(
  payload: RefsPayload,
  {
    enabled,
    select,
    onSuccess,
  }: {
    enabled?: boolean;
    select?: (data: string[]) => T;
    onSuccess?(data: T): void;
  } = {}
) {
  return useQuery(['git_repo_refs', { payload }], () => listRefs(payload), {
    enabled,
    retry: false,
    cacheTime: 0,
    select,
    onSuccess,
  });
}

export async function listRefs(payload: RefsPayload) {
  try {
    const { data } = await axios.post<string[]>('/gitops/repo/refs', payload);
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}
