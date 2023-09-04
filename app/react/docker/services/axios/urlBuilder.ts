import { Service } from 'docker-types/generated/1.41';

import { EnvironmentId } from '@/react/portainer/environments/types';

export function urlBuilder(
  endpointId: EnvironmentId,
  id?: Service['ID'],
  action?: string
) {
  let url = `/endpoints/${endpointId}/docker/services`;

  if (id) {
    url += `/${id}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
