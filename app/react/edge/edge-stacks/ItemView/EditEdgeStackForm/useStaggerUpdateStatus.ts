import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { EdgeStack } from '../../types';
import { queryKeys } from '../../queries/query-keys';
import { buildUrl } from '../../queries/buildUrl';

export function staggerStatusQueryKey(edgeStackId: EdgeStack['Id']) {
  return [...queryKeys.item(edgeStackId), 'stagger', 'status'] as const;
}

export function useStaggerUpdateStatus(edgeStackId: EdgeStack['Id']) {
  return useQuery(
    [...queryKeys.item(edgeStackId), 'stagger-status'],
    () => getStaggerStatus(edgeStackId),
    { enabled: isBE }
  );
}

interface StaggerStatusResponse {
  status: 'idle' | 'updating';
}

async function getStaggerStatus(edgeStackId: EdgeStack['Id']) {
  try {
    const { data } = await axios.get<StaggerStatusResponse>(
      buildUrl(edgeStackId, 'stagger/status')
    );
    return data.status;
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve stagger status');
  }
}
