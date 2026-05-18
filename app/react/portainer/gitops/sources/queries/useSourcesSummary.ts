import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { SourceStatus } from '../types';

import { sourceQueryKeys } from './query-keys';

export type SourcesSummary = Record<SourceStatus, number>;

async function getSourcesSummary(): Promise<SourcesSummary> {
  const { data } = await axios.get<SourcesSummary>('/gitops/sources/summary');
  return data;
}

export function useSourcesSummary() {
  return useQuery({
    queryKey: sourceQueryKeys.summary(),
    queryFn: getSourcesSummary,
    ...withError('Failed loading sources summary'),
  });
}
