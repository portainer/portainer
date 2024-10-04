import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';
import { formatArrayQueryParamsForDockerAPI } from '../utils';

/**
 * Raw docker API proxy
 */
export async function downloadImages(
  environmentId: EnvironmentId,
  images: { tags: string[]; id: string }[]
) {
  const names = images.map((image) =>
    image.tags[0] !== '<none>:<none>' ? image.tags[0] : image.id
  );

  try {
    const { data } = await axios.get(
      buildDockerProxyUrl(environmentId, 'images', 'get'),
      {
        params: { names },
        responseType: 'blob',
        paramsSerializer: formatArrayQueryParamsForDockerAPI,
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to download images');
  }
}
