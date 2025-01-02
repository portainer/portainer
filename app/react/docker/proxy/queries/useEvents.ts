import { EventMessage } from 'docker-types/generated/1.41';
import { useQuery } from '@tanstack/react-query';

import axios, {
  jsonObjectsToArrayHandler,
  parseAxiosError,
} from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from './buildDockerProxyUrl';
import { queryKeys } from './query-keys';

type Params = { since?: number; until?: number };

export function useEvents(
  environmentId: EnvironmentId,
  { params }: { params?: Params } = {}
) {
  return useQuery({
    queryKey: [...queryKeys.events(environmentId, params)],
    queryFn: () => getEvents(environmentId, params),
  });
}

/**
 * Raw docker API proxy
 */
export async function getEvents(
  environmentId: EnvironmentId,
  { since, until }: Params = {}
) {
  try {
    const { data } = await axios.get<EventMessage[]>(
      buildDockerProxyUrl(environmentId, 'events'),
      { params: { since, until }, transformResponse: jsonObjectsToArrayHandler }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve engine events');
  }
}
