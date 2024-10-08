import { Resources, RestartPolicy } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { withAgentTargetHeader } from '../../proxy/queries/utils';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

/**
 * UpdateConfig holds the mutable attributes of a Container.
 * Those attributes can be updated at runtime.
 */
interface UpdateConfig extends Resources {
  // Contains container's resources (cgroups, ulimits)
  RestartPolicy?: RestartPolicy;
}

/**
 * Raw docker API proxy
 */
export async function updateContainer(
  environmentId: EnvironmentId,
  containerId: string,
  config: UpdateConfig,
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    await axios.post<{ Warnings: string[] }>(
      buildDockerProxyUrl(environmentId, 'containers', containerId, 'update'),
      config,
      { headers: { ...withAgentTargetHeader(nodeName) } }
    );
  } catch (err) {
    throw parseAxiosError(err, 'failed updating container');
  }
}
