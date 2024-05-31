import { useQuery } from '@tanstack/react-query';
import { Volume } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';
import { buildUrl } from './build-url';

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
    const { data } = await axios.get<VolumesResponse>(buildUrl(environmentId));

    return data.Volumes;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve volumes');
  }
}
