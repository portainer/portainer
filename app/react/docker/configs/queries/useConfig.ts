import { Config } from 'docker-types';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { PortainerResponse } from '../../types';

import { buildUrl } from './build-url';

export async function getConfig(
  environmentId: EnvironmentId,
  configId: Config['ID']
) {
  try {
    const { data } = await axios.get<PortainerResponse<Config>>(
      buildUrl(environmentId, configId)
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve config');
  }
}
