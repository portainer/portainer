import { ImageInspect } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id
 * @returns
 */
export async function getImage(
  environmentId: EnvironmentId,
  id: Required<ImageInspect['Id']>
) {
  try {
    const { data } = await axios.get<ImageInspect>(
      buildDockerProxyUrl(environmentId, 'images', id, 'json')
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve image');
  }
}
