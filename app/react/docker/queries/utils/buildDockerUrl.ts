import { compact } from 'lodash';

import { EnvironmentId } from '@/react/portainer/environments/types';

/**
 * Build docker URL for Environment
 *
 * @param environmentId
 * @param action
 * @param subSegments Sub segments are only added to the URL when they are not `undefined`.
 * @returns `/docker/{environmentId}/{action}/{subSegments[0]}/{subSegments[1]}/...`
 *
 * @example
 * // all calls return /docker/1/action/sub1/sub2
 * buildDockerUrl(1, 'action', 'sub1', 'sub2');
 * buildDockerUrl(1, 'action', undefined, 'sub1', undefined, 'sub2');
 *
 * @example
 * function buildUrl(endpointId: EnvironmentId, id?: ServiceId, action?: string) {
 *   return buildDockerUrl(endpointId, 'services', id, action);
 *}
 *
 * // returns /docker/1/services/ubx3r/update
 * buildUrl(1, 'ubx3r', 'update')
 *
 * // returns /docker/1/services/update
 * buildUrl(1, undefined, 'update')
 *
 * // returns /docker/1/services/ubx3r
 * buildUrl(1, 'ubx3r') // = buildUrl(1, 'ubx3r', undefined)
 *
 * // returns /docker/1/services
 * buildUrl(1) // = buildUrl(1, undefined, undefined)
 *
 */
export function buildDockerUrl(
  environmentId: EnvironmentId,
  action: string,
  ...subSegments: unknown[]
) {
  let url = `/docker/${environmentId}/${action}`;

  const joined = compact(subSegments).join('/');

  if (joined) {
    url += `/${joined}`;
  }

  return url;
}
