import { buildUrl as buildProxyUrl } from '@/react/docker/proxy/queries/build-url';
import { EnvironmentId } from '@/react/portainer/environments/types';

export function buildUrl(
  environmentId: EnvironmentId,
  { action, id }: { id?: string; action?: string } = {}
) {
  let url = buildProxyUrl(environmentId, 'volumes');

  if (id) {
    url += `/${id}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
