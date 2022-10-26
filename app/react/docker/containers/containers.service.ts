import { EnvironmentId } from '@/react/portainer/environments/types';
import PortainerError from '@/portainer/error';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { genericHandler } from '@/docker/rest/response/handlers';

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

export async function updateNamespace(
  endpointId: EnvironmentId,
  id: ContainerId,
  name: string
) {
  await axios.post<void>(
    buildUrl('createOrUpdate'),
    {
      Name: name,
      EndpointID: endpointId,
      ContainerId: id,
    },
  );
}

export async function getNamespace(containerId: string) {
  try {
    const response = await axios.get<string[]>(
      buildUrl(containerId)
    );
    return response.data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export async function getNamespaces() {
  try {
    const response = await axios.get<string[]>(
      buildUrl()
    );
    return response.data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
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

export function urlBuilder(
  endpointId: EnvironmentId,
  id?: ContainerId,
  action?: string
) {
  let url = `/endpoints/${endpointId}/docker/containers`;

  if (id) {
    url += `/${id}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}

function buildUrl(id = '') {
  let url = `/namespaces`;

  if (id) {
    url += `/${id}`;
  }
  return url;
}
