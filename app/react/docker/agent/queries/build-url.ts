import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl } from '../../proxy/queries/build-url';

export function buildAgentUrl(
  environmentId: EnvironmentId,
  apiVersion: number,
  action: string
) {
  let url = buildUrl(environmentId, '');

  if (apiVersion > 1) {
    url += `v${apiVersion}/`;
  }

  url += `${action}`;

  return url;
}
