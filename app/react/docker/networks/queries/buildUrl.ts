import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl as buildDockerUrl } from '../../proxy/queries/build-url';
import { NetworkId } from '../types';

export function buildUrl(
  environmentId: EnvironmentId,
  { id, action }: { id?: NetworkId; action?: string } = {}
) {
  let baseUrl = 'networks';
  if (id) {
    baseUrl += `/${id}`;
  }

  if (action) {
    baseUrl += `/${action}`;
  }

  return buildDockerUrl(environmentId, baseUrl);
}
