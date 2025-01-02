import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { DockerConfig } from '../types';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

export async function deleteConfig(
  environmentId: EnvironmentId,
  id: DockerConfig['Id']
) {
  try {
    await axios.delete(buildDockerProxyUrl(environmentId, 'configs', id));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete config');
  }
}
