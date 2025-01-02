import { useQuery } from '@tanstack/react-query';
import { Volume } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { buildDockerProxyUrl } from '@/react/docker/proxy/queries/buildDockerProxyUrl';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { withFiltersQueryParam } from '../../proxy/queries/utils';

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

type Filters = {
  /**
   * When set to true (or 1), returns all volumes that are not in use by a container.
   * When set to false (or 0), only volumes that are in use by one or more containers are returned.
   */
  dangling?: ['true' | 'false'];
  /**
   * <volume-driver-name>
   * Matches volumes based on their driver.
   */
  driver?: string;
  /**
   * <key> or <key>:<value>
   * Matches volumes based on the presence of a label alone or a label and a value.
   */
  label?: string;
  /**
   * Matches all or part of a volume name.
   */
  name?: Volume['Name'];
};

export async function getVolumes(
  environmentId: EnvironmentId,
  filters?: Filters
) {
  try {
    const { data } = await axios.get<VolumesResponse>(
      buildDockerProxyUrl(environmentId, 'volumes'),
      {
        params: {
          ...withFiltersQueryParam(filters),
        },
      }
    );

    return data.Volumes;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve volumes');
  }
}
