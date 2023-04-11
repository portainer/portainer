import { AxiosRequestHeaders } from 'axios';

import { EnvironmentId } from '@/react/portainer/environments/types';
import PortainerError from '@/portainer/error';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { genericHandler } from '@/docker/rest/response/handlers';

import { ContainerId } from './types';

export async function startContainer(
  environmentId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers: AxiosRequestHeaders = {};

  if (nodeName) {
    headers['X-PortainerAgent-Target'] = nodeName;
  }

  try {
    await axios.post<void>(
      urlBuilder(environmentId, id, 'start'),
      {},
      { transformResponse: genericHandler, headers }
    );
  } catch (e) {
    throw parseAxiosError(e, 'Failed starting container');
  }
}

export async function stopContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers: AxiosRequestHeaders = {};

  if (nodeName) {
    headers['X-PortainerAgent-Target'] = nodeName;
  }

  await axios.post<void>(urlBuilder(endpointId, id, 'stop'), {}, { headers });
}

export async function recreateContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  pullImage: boolean,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers: AxiosRequestHeaders = {};

  if (nodeName) {
    headers['X-PortainerAgent-Target'] = nodeName;
  }

  await axios.post<void>(
    `/docker/${endpointId}/containers/${id}/recreate`,
    {
      PullImage: pullImage,
    },
    { headers }
  );
}

export async function restartContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers: AxiosRequestHeaders = {};

  if (nodeName) {
    headers['X-PortainerAgent-Target'] = nodeName;
  }

  await axios.post<void>(
    urlBuilder(endpointId, id, 'restart'),
    {},
    { headers }
  );
}

export async function killContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers: AxiosRequestHeaders = {};

  if (nodeName) {
    headers['X-PortainerAgent-Target'] = nodeName;
  }

  await axios.post<void>(urlBuilder(endpointId, id, 'kill'), {}, { headers });
}

export async function pauseContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers: AxiosRequestHeaders = {};

  if (nodeName) {
    headers['X-PortainerAgent-Target'] = nodeName;
  }

  await axios.post<void>(urlBuilder(endpointId, id, 'pause'), {}, { headers });
}

export async function resumeContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers: AxiosRequestHeaders = {};

  if (nodeName) {
    headers['X-PortainerAgent-Target'] = nodeName;
  }

  await axios.post<void>(
    urlBuilder(endpointId, id, 'unpause'),
    {},
    { headers }
  );
}

export async function renameContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  name: string,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers: AxiosRequestHeaders = {};

  if (nodeName) {
    headers['X-PortainerAgent-Target'] = nodeName;
  }

  await axios.post<void>(
    urlBuilder(endpointId, id, 'rename'),
    {},
    { params: { name }, transformResponse: genericHandler, headers }
  );
}

export async function removeContainer(
  endpointId: EnvironmentId,
  containerId: string,
  {
    nodeName,
    removeVolumes,
  }: { removeVolumes?: boolean; nodeName?: string } = {}
) {
  try {
    const headers: AxiosRequestHeaders = {};

    if (nodeName) {
      headers['X-PortainerAgent-Target'] = nodeName;
    }

    const { data } = await axios.delete<null | { message: string }>(
      urlBuilder(endpointId, containerId),
      {
        params: { v: removeVolumes ? 1 : 0, force: true },
        transformResponse: genericHandler,
        headers,
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
