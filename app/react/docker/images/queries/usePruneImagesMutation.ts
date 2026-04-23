import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withInvalidate } from '@/react-tools/react-query';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

import { queryKeys } from './queryKeys';

interface PruneOptions {
  all?: boolean;
  clearBuildCache?: boolean;
}

export function usePruneImagesMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: PruneOptions) => pruneAll(environmentId, options),
    ...withInvalidate(queryClient, [queryKeys.base(environmentId)]),
  });
}

export interface PruneResult {
  SpaceReclaimed: number;
  buildCacheError?: unknown;
}

async function pruneAll(
  environmentId: EnvironmentId,
  { all = false, clearBuildCache = false }: PruneOptions
): Promise<PruneResult> {
  const imageData = await pruneImages(environmentId, { all });
  let spaceReclaimed = imageData.SpaceReclaimed;

  if (!clearBuildCache) {
    return { SpaceReclaimed: spaceReclaimed };
  }

  try {
    const cacheData = await pruneBuildCache(environmentId);
    spaceReclaimed += cacheData.SpaceReclaimed;
    return { SpaceReclaimed: spaceReclaimed };
  } catch (buildCacheError) {
    return { SpaceReclaimed: spaceReclaimed, buildCacheError };
  }
}

interface PruneImagesResponse {
  ImagesDeleted: Array<{ Deleted?: string; Untagged?: string }> | null;
  SpaceReclaimed: number;
}

async function pruneImages(
  environmentId: EnvironmentId,
  { all = false }: { all?: boolean }
): Promise<PruneImagesResponse> {
  try {
    const { data } = await axios.post<PruneImagesResponse>(
      buildDockerProxyUrl(environmentId, 'images', 'prune'),
      null,
      {
        params: {
          filters: JSON.stringify({ dangling: [all ? 'false' : 'true'] }),
        },
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to prune images');
  }
}

interface PruneBuildCacheResponse {
  CachesDeleted: string[] | null;
  SpaceReclaimed: number;
}

async function pruneBuildCache(
  environmentId: EnvironmentId
): Promise<PruneBuildCacheResponse> {
  try {
    const { data } = await axios.post<PruneBuildCacheResponse>(
      buildDockerProxyUrl(environmentId, 'build', 'prune'),
      null
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to prune build cache');
  }
}
