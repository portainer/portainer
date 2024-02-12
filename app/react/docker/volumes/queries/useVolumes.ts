import { useQuery } from 'react-query';
import { Volume } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { buildUrl as buildDockerUrl } from '@/react/docker/proxy/queries/build-url';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

export function useVolumes<T = Volume[]>(
  environmentId: EnvironmentId,
  { select }: { select?: (data: Volume[]) => T } = {}
) {
  return useQuery(
    queryKeys.base(environmentId),
    () => getVolumes(environmentId),
    { select }
  );
}

interface VolumesResponse {
  Volumes: Volume[];
}

export async function getVolumes(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<VolumesResponse>(
      buildUrl(environmentId, 'volumes')
    );

    return data.Volumes;
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve volumes');
  }
}

function buildUrl(environmentId: EnvironmentId, action: string, id?: string) {
  let url = buildDockerUrl(environmentId, action);

  if (id) {
    url += `/${id}`;
  }

  return url;
}
