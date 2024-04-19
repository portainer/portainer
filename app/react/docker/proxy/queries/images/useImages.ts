import { useQuery } from '@tanstack/react-query';
import { ImageSummary } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl } from '../build-url';

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

async function getImages(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<ImagesListResponse>(
      buildUrl(environmentId, 'images', 'json')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve images');
  }
}
