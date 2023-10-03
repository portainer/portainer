import { EnvironmentId } from '@/react/portainer/environments/types';
import { buildUrl as buildDockerUrl } from '@/react/docker/queries/utils/build-url';

export function buildUrl(environmentId: EnvironmentId) {
  return buildDockerUrl(environmentId, 'images');
}
