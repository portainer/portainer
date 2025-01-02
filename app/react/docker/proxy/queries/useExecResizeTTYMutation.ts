import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from './buildDockerProxyUrl';

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id exec instance id
 */
export async function resizeTTY(
  environmentId: EnvironmentId,
  id: string,
  { width, height }: { width: number; height: number }
) {
  try {
    await axios.post(
      buildDockerProxyUrl(environmentId, 'exec', id, 'resize'),
      {},
      {
        params: {
          h: height,
          w: width,
        },
      }
    );
  } catch (err) {
    throw parseAxiosError(err, 'Unable to resize tty of exec');
  }
}
