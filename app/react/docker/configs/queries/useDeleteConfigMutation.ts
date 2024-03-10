import { Config } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

export async function deleteConfig(
  environmentId: EnvironmentId,
  id: Config['ID']
) {
  try {
    await axios.delete(buildDockerProxyUrl(environmentId, 'configs', id));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete config');
  }
}
