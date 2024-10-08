import { EventMessage } from 'docker-types/generated/1.41';

import axios, {
  jsonObjectsToArrayHandler,
  parseAxiosError,
} from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from './buildDockerProxyUrl';

/**
 * Raw docker API proxy
 * @param environmentId
 * @param param1
 * @returns
 */
export async function getEvents(
  environmentId: EnvironmentId,
  { since, until }: { since: string; until: string }
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
