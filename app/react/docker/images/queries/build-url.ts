import { EnvironmentId } from '@/react/portainer/environments/types';
import { buildUrl as buildDockerUrl } from '@/react/docker/queries/utils/build-url';
import { buildUrl as buildDockerProxyUrl } from '@/react/docker/proxy/queries/build-url';

export function buildUrl(environmentId: EnvironmentId) {
  return buildDockerUrl(environmentId, 'images');
}

export function buildProxyUrl(
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

  return buildDockerProxyUrl(environmentId, 'images', dockerAction);
}
