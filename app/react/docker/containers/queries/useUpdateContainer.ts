import { Resources, RestartPolicy } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { urlBuilder } from '../containers.service';
import { addNodeHeader } from '../../proxy/addNodeHeader';

/**
 * UpdateConfig holds the mutable attributes of a Container.
 * Those attributes can be updated at runtime.
 */
interface UpdateConfig extends Resources {
  // Contains container's resources (cgroups, ulimits)

  RestartPolicy?: RestartPolicy;
}

export async function updateContainer(
  environmentId: EnvironmentId,
  containerId: string,
  config: UpdateConfig,
  { nodeName }: { nodeName?: string } = {}
) {
  const headers = addNodeHeader(nodeName);

  try {
    await axios.post<{ Warnings: string[] }>(
      urlBuilder(environmentId, containerId, 'update'),
      config,
      { headers }
    );
  } catch (err) {
    throw parseAxiosError(err, 'failed updating container');
  }
}
