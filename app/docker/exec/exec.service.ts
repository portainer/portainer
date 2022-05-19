import { EnvironmentId } from '@/portainer/environments/types';
import axios from '@/portainer/services/axios';

import { genericHandler } from '../rest/response/handlers';

import { ExecId } from './types';

export async function startExec(endpointId: EnvironmentId, id: ExecId) {
  await axios.post<void>(
    urlBuilder(endpointId, id, 'start'),
    {},
    { transformResponse: genericHandler }
  );
}

function urlBuilder(endpointId: EnvironmentId, id?: ExecId, action?: string) {
  let url = `/endpoints/${endpointId}/docker/exec`;

  if (id) {
    url += `/${id}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
