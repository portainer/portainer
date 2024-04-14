import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl } from './build-url';
import { queryKeys } from './queryKeys';

export interface ImagesListResponse {
  created: number;
  nodeName?: string;
  id: string;
  size: number;
  tags?: string[];

  /**
   * Used is true if the image is used by at least one container.
   * supplied only when withUsage is true
   */
  used: boolean;
}

export function useImages<T = Array<ImagesListResponse>>(
  environmentId: EnvironmentId,
  withUsage = false,
  {
    select,
    enabled,
    refetchInterval,
  }: {
    select?(data: Array<ImagesListResponse>): T;
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  return useQuery(
    queryKeys.list(environmentId, { withUsage }),
    () => getImages(environmentId, { withUsage }),
    { select, enabled, refetchInterval }
  );
}

async function getImages(
  environmentId: EnvironmentId,
  { withUsage }: { withUsage?: boolean } = {}
) {
  try {
    const { data } = await axios.get<Array<ImagesListResponse>>(
      buildUrl(environmentId),
      { params: { withUsage } }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve images');
  }
}
