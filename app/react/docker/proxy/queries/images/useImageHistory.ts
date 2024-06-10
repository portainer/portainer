import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';

export type ImageLayer = {
  Id: string;
  Created: number;
  CreatedBy: string;
  Tags: string[];
  Size: number;
  Comment: string;
};

/**
 * Raw docker API proxy
 * @param environmentId
 * @returns
 */
export async function getImageHistory(
  environmentId: EnvironmentId,
  id: ImageLayer['Id']
) {
  try {
    const { data } = await axios.get<ImageLayer[]>(
      buildDockerProxyUrl(environmentId, 'images', id, 'history')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve image layers');
  }
}
