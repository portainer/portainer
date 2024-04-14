import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { genericHandler } from '@/docker/rest/response/handlers';

import { ContainerId } from '../types';
import { urlBuilder } from '../containers.service';
import { addNodeName } from '../../proxy/addNodeName';

import { queryKeys } from './query-keys';
import { ContainerJSON } from './container';

export function useContainerInspect(
  environmentId: EnvironmentId,
  id: ContainerId,
  params: { nodeName?: string } = {}
) {
  return useQuery({
    queryKey: [...queryKeys.container(environmentId, id), params] as const,
    queryFn: () => inspectContainer(environmentId, id, params),
  });
}

export async function inspectContainer(
  environmentId: EnvironmentId,
  id: ContainerId,
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    const { data } = await axios.get<ContainerJSON>(
      urlBuilder(environmentId, id, 'json'),
      { transformResponse: genericHandler, headers: addNodeName(nodeName) }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Failed starting container');
  }
}
