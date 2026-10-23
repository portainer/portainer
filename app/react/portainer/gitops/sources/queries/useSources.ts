import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';
import { withPaginationHeaders } from '@/react/common/api/pagination.types';

import { Source, SourceStatus, SourceType } from '../types';

import { sourceQueryKeys } from './query-keys';

export interface SourcesParams {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  start?: number;
  limit?: number;
  status?: SourceStatus | null;
  type?: SourceType | null;
}

async function getSources(params: SourcesParams) {
  const response = await axios.get<Source[]>('/gitops/sources', { params });
  return withPaginationHeaders(response);
}

export function useSources(
  params: SourcesParams,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: sourceQueryKeys.list(params),
    queryFn: () => getSources(params),
    enabled,
    ...withError('Failed loading sources'),
  });
}
