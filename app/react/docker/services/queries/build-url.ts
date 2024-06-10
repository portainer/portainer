import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { ServiceId } from '../types';

export function buildUrl(
  endpointId: EnvironmentId,
  id?: ServiceId,
  action?: string
) {
  return buildDockerProxyUrl(endpointId, 'services', id, action);
}
