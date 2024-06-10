import { Config } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

export async function getConfigs(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<Config[]>(
      buildDockerProxyUrl(environmentId, 'configs')
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve configs');
  }
}
