import { Config } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { DockerConfig } from '../types';

export async function getConfig(
  environmentId: EnvironmentId,
  configId: DockerConfig['Id']
) {
  try {
    const { data } = await axios.get<Config>(
      buildDockerProxyUrl(environmentId, 'configs', configId)
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve config');
  }
}
