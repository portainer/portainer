import { EndpointId } from '@/portainer/endpoints/types';
import PortainerError from '@/portainer/error';
import axios from '@/portainer/services/axios';

import { genericHandler } from '../rest/response/handlers';

import { ContainerId, DockerContainer } from './types';

export async function startContainer(endpointId: EndpointId, id: ContainerId) {
  await axios.post<void>(
    urlBuilder(endpointId, id, 'start'),
    {},
    { transformResponse: genericHandler }
  );
}

export async function stopContainer(endpointId: EndpointId, id: ContainerId) {
  await axios.post<void>(urlBuilder(endpointId, id, 'stop'), {});
}

export async function restartContainer(
  endpointId: EndpointId,
  id: ContainerId
) {
  await axios.post<void>(urlBuilder(endpointId, id, 'restart'), {});
}

export async function killContainer(endpointId: EndpointId, id: ContainerId) {
  await axios.post<void>(urlBuilder(endpointId, id, 'kill'), {});
}

export async function pauseContainer(endpointId: EndpointId, id: ContainerId) {
  await axios.post<void>(urlBuilder(endpointId, id, 'pause'), {});
}

export async function resumeContainer(endpointId: EndpointId, id: ContainerId) {
  await axios.post<void>(urlBuilder(endpointId, id, 'unpause'), {});
}

export async function renameContainer(
  endpointId: EndpointId,
  id: ContainerId,
  name: string
) {
  await axios.post<void>(
    urlBuilder(endpointId, id, 'rename'),
    {},
    { params: { name }, transformResponse: genericHandler }
  );
}

export async function removeContainer(
  endpointId: EndpointId,
  container: DockerContainer,
  removeVolumes: boolean
) {
  try {
    const { data } = await axios.delete<null | { message: string }>(
      urlBuilder(endpointId, container.Id),
      {
        params: { v: removeVolumes ? 1 : 0, force: true },
        transformResponse: genericHandler,
      }
    );

    if (data && data.message) {
      throw new PortainerError(data.message);
    }
  } catch (e) {
    throw new PortainerError('Unable to remove container', e as Error);
  }
}

function urlBuilder(endpointId: EndpointId, id: ContainerId, action?: string) {
  const url = `/endpoints/${endpointId}/docker/containers/${id}`;

  if (action) {
    return `${url}/${action}`;
  }

  return url;
}
