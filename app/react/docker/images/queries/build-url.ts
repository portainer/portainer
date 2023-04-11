import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl as buildDockerUrl } from '../../proxy/queries/build-url';

export function buildUrl(
  environmentId: EnvironmentId,
  { id, action }: { id?: string; action?: string } = {}
) {
  let dockerAction = '';
  if (id) {
    dockerAction += `${id}`;
  }

  if (action) {
    dockerAction = dockerAction ? `${dockerAction}/${action}` : action;
  }

  return buildDockerUrl(environmentId, 'images', dockerAction);
}
