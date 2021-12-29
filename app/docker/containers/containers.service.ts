import { EnvironmentId } from '@/portainer/environments/types';
import PortainerError from '@/portainer/error';
import axios from '@/portainer/services/axios';

import { genericHandler } from '../rest/response/handlers';

import { ContainerId, DockerContainer } from './types';

export async function startContainer(
  endpointId: EnvironmentId,
  id: ContainerId
) {
  await axios.post<void>(
    urlBuilder(endpointId, id, 'start'),
    {},
    { transformResponse: genericHandler }
  );
}

export async function stopContainer(
  endpointId: EnvironmentId,
  id: ContainerId
) {
  await axios.post<void>(urlBuilder(endpointId, id, 'stop'), {});
}

export async function restartContainer(
  endpointId: EnvironmentId,
  id: ContainerId
) {
  await axios.post<void>(urlBuilder(endpointId, id, 'restart'), {});
}

export async function killContainer(
  endpointId: EnvironmentId,
  id: ContainerId
) {
  await axios.post<void>(urlBuilder(endpointId, id, 'kill'), {});
}

export async function pauseContainer(
  endpointId: EnvironmentId,
  id: ContainerId
) {
  await axios.post<void>(urlBuilder(endpointId, id, 'pause'), {});
}

export async function resumeContainer(
  endpointId: EnvironmentId,
  id: ContainerId
) {
  await axios.post<void>(urlBuilder(endpointId, id, 'unpause'), {});
}

export async function renameContainer(
  endpointId: EnvironmentId,
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
  endpointId: EnvironmentId,
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

function urlBuilder(
  endpointId: EnvironmentId,
  id: ContainerId,
  action?: string
) {
  const url = `/endpoints/${endpointId}/docker/containers/${id}`;

  if (action) {
    return `${url}/${action}`;
  }

  return url;
}
