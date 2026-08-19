import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { withError } from '@/react-tools/react-query';

interface RefsPayload {
  force?: boolean;
  sourceId: number;
}

export function useGitRefs<T = string[]>(
  payload: RefsPayload,
  {
    enabled,
    select,
    onSuccess,
    onSettled,
    suppressError,
    cacheTime = 0,
  }: {
    enabled?: boolean;
    select?: (data: string[]) => T;
    onSuccess?(data: T): void;
    onSettled?(data: T | undefined, error: unknown): void;
    suppressError?: boolean;
    cacheTime?: number;
  } = {}
) {
  return useQuery({
    queryKey: ['gitops', 'refs', payload],
    queryFn: () => listRefs(payload),
    enabled: isBE && enabled,
    retry: false,
    cacheTime,
    select,
    onSuccess,
    onSettled,
    ...(suppressError ? {} : withError('Failed loading refs')),
  });
}

export async function listRefs({ force, ...body }: RefsPayload) {
  const { data } = await axios.post<string[]>('/gitops/repo/refs', body, {
    params: { force },
  });
  return data;
}
