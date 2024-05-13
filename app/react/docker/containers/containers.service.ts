import { EnvironmentId } from '@/react/portainer/environments/types';
import PortainerError from '@/portainer/error';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { genericHandler } from '@/docker/rest/response/handlers';

import { addNodeHeader } from '../proxy/addNodeHeader';

import { ContainerId } from './types';

export async function startContainer(
  environmentId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers = addNodeHeader(nodeName);
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
  const headers = addNodeHeader(nodeName);
  try {
    await axios.post<void>(urlBuilder(endpointId, id, 'stop'), {}, { headers });
  } catch (e) {
    throw parseAxiosError(e, 'Failed stopping container');
  }
}

export async function recreateContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  pullImage: boolean,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers = addNodeHeader(nodeName);
  try {
    await axios.post<void>(
      `/docker/${endpointId}/containers/${id}/recreate`,
      {
        PullImage: pullImage,
      },
      { headers }
    );
  } catch (e) {
    throw parseAxiosError(e, 'Failed recreating container');
  }
}

export async function restartContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers = addNodeHeader(nodeName);
  try {
    await axios.post<void>(
      urlBuilder(endpointId, id, 'restart'),
      {},
      { headers }
    );
  } catch (e) {
    throw parseAxiosError(e, 'Failed restarting container');
  }
}

export async function killContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers = addNodeHeader(nodeName);
  try {
    await axios.post<void>(urlBuilder(endpointId, id, 'kill'), {}, { headers });
  } catch (e) {
    throw parseAxiosError(e, 'Failed killing container');
  }
}

export async function pauseContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers = addNodeHeader(nodeName);
  try {
    await axios.post<void>(
      urlBuilder(endpointId, id, 'pause'),
      {},
      { headers }
    );
  } catch (e) {
    throw parseAxiosError(e, 'Failed pausing container');
  }
}

export async function resumeContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers = addNodeHeader(nodeName);
  try {
    await axios.post<void>(
      urlBuilder(endpointId, id, 'unpause'),
      {},
      { headers }
    );
  } catch (e) {
    throw parseAxiosError(e, 'Failed resuming container');
  }
}

export async function renameContainer(
  endpointId: EnvironmentId,
  id: ContainerId,
  name: string,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers = addNodeHeader(nodeName);
  try {
    await axios.post<void>(
      urlBuilder(endpointId, id, 'rename'),
      {},
      {
        params: { name },
        transformResponse: genericHandler,
        headers,
      }
    );
  } catch (e) {
    throw parseAxiosError(e, 'Failed renaming container');
  }
}

export async function removeContainer(
  endpointId: EnvironmentId,
  containerId: string,
  {
    nodeName,
    removeVolumes,
  }: { removeVolumes?: boolean; nodeName?: string } = {}
) {
  const headers = addNodeHeader(nodeName);
  try {
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
    throw parseAxiosError(e, 'Failed removing container');
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
