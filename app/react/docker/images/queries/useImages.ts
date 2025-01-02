import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerUrl } from '../../queries/utils/buildDockerUrl';

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

/**
 * Used in ImagesDatatable
 *
 * Query /api/docker/{envId}/images
 */
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
      buildDockerUrl(environmentId, 'images'),
      { params: { withUsage } }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve images');
  }
}
