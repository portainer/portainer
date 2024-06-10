import { compact } from 'lodash';

import { EnvironmentId } from '@/react/portainer/environments/types';

/**
 * Build docker proxy URL for Environment
 *
 * @param environmentId
 * @param action
 * @param subSegments  Sub segments are only added to the URL when they are not `undefined`.
 * @returns `/endpoints/{environmentId}/docker/{action}/{subSegments[0]}/{subSegments[1]}/...`
 *
 * @example
 * // all calls return /endpoints/1/docker/action/sub1/sub2
 * buildDockerProxyUrl(1, 'action', 'sub1', 'sub2');
 * buildDockerProxyUrl(1, 'action', undefined, 'sub1', undefined, 'sub2');
 *
 * @example
 * function buildUrl(endpointId: EnvironmentId, id?: ServiceId, action?: string) {
 *   return buildDockerProxyUrl(endpointId, 'services', id, action);
 *}
 *
 * // returns /endpoints/1/docker/services/ubx3r/update
 * buildUrl(1, 'ubx3r', 'update')
 *
 * // returns /endpoints/1/docker/services/update
 * buildUrl(1, undefined, 'update')
 *
 * // returns /endpoints/1/docker/services/ubx3r
 * buildUrl(1, 'ubx3r') // = buildUrl(1, 'ubx3r', undefined)
 *
 * // returns /endpoints/1/docker/services
 * buildUrl(1) // = buildUrl(1, undefined, undefined)
 *
 */
export function buildDockerProxyUrl(
  environmentId: EnvironmentId,
  action: string,
  ...subSegments: unknown[]
) {
  let url = `/endpoints/${environmentId}/docker/${action}`;

  const joined = compact(subSegments).join('/');

  if (joined) {
    url += `/${joined}`;
  }

  return url;
}
