import { Volume } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

/**
 * Raw docker API query
 * @param environmentId
 * @param name
 * @returns
 */
export async function getVolume(
  environmentId: EnvironmentId,
  name: Volume['Name']
) {
  try {
    const { data } = await axios.get(
      buildDockerProxyUrl(environmentId, 'volumes', name)
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve volume details');
  }
}
