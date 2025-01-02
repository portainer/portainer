import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { ContainerId } from '../types';
import { withAgentTargetHeader } from '../../proxy/queries/utils';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

import { queryKeys } from './query-keys';
import { ContainerDetailsJSON } from './useContainer';

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
    const { data } = await axios.get<ContainerDetailsJSON>(
      buildDockerProxyUrl(environmentId, 'containers', id, 'json'),
      { headers: { ...withAgentTargetHeader(nodeName) } }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Failed inspecting container');
  }
}
