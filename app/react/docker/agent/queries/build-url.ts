import { EnvironmentId } from '@/react/portainer/environments/types';

export function buildAgentUrl(
  environmentId: EnvironmentId,
  apiVersion: number,
  action: string
) {
  let url = `/endpoints/${environmentId}/agent/docker`;

  if (apiVersion > 1) {
    url += `/v${apiVersion}`;
  }

  url += `/${action}`;

  return url;
}
