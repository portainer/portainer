import axios, {
  jsonObjectsToArrayHandler,
  parseAxiosError,
} from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { Registry } from '@/react/portainer/registries/types/registry';

import { buildImageFullURI } from '../utils';
import { withRegistryAuthHeader } from '../../proxy/queries/utils';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

interface PushImageOptions {
  environmentId: EnvironmentId;
  image: string;
  registry?: Registry;
}

export async function pushImage({
  environmentId,
  image,
  registry,
}: PushImageOptions) {
  const imageURI = buildImageFullURI(image, registry);

  try {
    const { data } = await axios.post(
      buildDockerProxyUrl(environmentId, 'images', imageURI, 'push'),
      null,
      {
        headers: {
          ...withRegistryAuthHeader(registry?.Id),
        },
        transformResponse: jsonObjectsToArrayHandler,
      }
    );
    if (data[data.length - 1].error) {
      throw new Error(data[data.length - 1].error);
    }
  } catch (err) {
    throw parseAxiosError(err, 'Unable to push image');
  }
}
