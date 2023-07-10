import { EnvironmentId } from '@/react/portainer/environments/types';

export function buildUrl(
  environmentId: EnvironmentId,
  action: string,
  subAction = ''
) {
  let url = `/endpoints/${environmentId}/docker/${action}`;

  if (subAction) {
    url += `/${subAction}`;
  }

  return url;
}
