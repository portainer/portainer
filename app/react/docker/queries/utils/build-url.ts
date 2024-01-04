import { EnvironmentId } from '@/react/portainer/environments/types';

export function buildUrl(environmentId: EnvironmentId, path: string) {
  return `/docker/${environmentId}/${path}`;
}
