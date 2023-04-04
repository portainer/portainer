import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

interface SearchPayload {
  repository: string;
  keyword: string;
  reference?: string;
  username?: string;
  password?: string;
  tlsSkipVerify?: boolean;
}

export function useSearch(payload: SearchPayload, enabled: boolean) {
  return useQuery(
    ['git_repo_search_results', { payload }],
    () => searchRepo(payload),
    {
      enabled,
      retry: false,
      cacheTime: 0,
    }
  );
}

export async function searchRepo(payload: SearchPayload) {
  try {
    const { data } = await axios.post<string[] | null>(
      '/gitops/repo/files/search',
      payload
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}
