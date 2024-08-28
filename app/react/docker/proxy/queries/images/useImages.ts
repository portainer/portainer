import { useQuery } from '@tanstack/react-query';
import { ImageSummary } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';

import { queryKeys } from './queryKeys';

type ImagesListResponse = Array<ImageSummary>;

export function useImages<T = ImagesListResponse>(
  environmentId: EnvironmentId,
  {
    select,
    enabled,
  }: { select?(data: ImagesListResponse): T; enabled?: boolean } = {}
) {
  return useQuery(
    queryKeys.list(environmentId),
    () => getImages(environmentId),
    { select, enabled }
  );
}

/**
 * Raw docker API proxy
 * @param environmentId
 * @returns
 */
export async function getImages(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<ImagesListResponse>(
      buildDockerProxyUrl(environmentId, 'images', 'json')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve images');
  }
}
