import { buildDockerProxyUrl } from '@/react/docker/proxy/queries/buildDockerProxyUrl';
import { EnvironmentId } from '@/react/portainer/environments/types';

export function buildUrl(
  environmentId: EnvironmentId,
  { action, id }: { id?: string; action?: string } = {}
) {
  let url = buildDockerProxyUrl(environmentId, 'volumes');

  if (id) {
    url += `/${id}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
