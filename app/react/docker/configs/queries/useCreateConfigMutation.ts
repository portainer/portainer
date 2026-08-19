import { ConfigSpec } from 'docker-types';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { PortainerResponse } from '../../types';

export async function createConfig(
  environmentId: EnvironmentId,
  config: ConfigSpec
) {
  try {
    const { data } = await axios.post<PortainerResponse<{ Id: string }>>(
      buildDockerProxyUrl(environmentId, 'configs', 'create'),
      config
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to create config');
  }
}
