import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl as buildProxyUrl } from '../build-url';

export function buildUrl(
  environmentId: EnvironmentId,
  action?: string,
  subAction = ''
) {
  return buildProxyUrl(
    environmentId,
    'nodes',
    subAction ? `${action}/${subAction}` : action
  );
}
