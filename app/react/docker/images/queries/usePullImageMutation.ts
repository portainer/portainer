import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { Registry } from '@/react/portainer/registries/types/registry';

import { buildImageFullURI } from '../utils';
import {
  withRegistryAuthHeader,
  withAgentTargetHeader,
} from '../../proxy/queries/utils';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

interface PullImageOptions {
  environmentId: EnvironmentId;
  image: string;
  nodeName?: string;
  registry?: Registry;
  ignoreErrors: boolean;
}

export async function pullImage({
  environmentId,
  ignoreErrors,
  image,
  nodeName,
  registry,
}: PullImageOptions) {
  const imageURI = buildImageFullURI(image, registry);

  try {
    await axios.post(
      buildDockerProxyUrl(environmentId, 'images', 'create'),
      null,
      {
        params: {
          fromImage: imageURI,
        },
        headers: {
          ...withRegistryAuthHeader(registry?.Id),
          ...withAgentTargetHeader(nodeName),
        },
      }
    );
  } catch (err) {
    if (ignoreErrors) {
      return;
    }

    throw parseAxiosError(err, 'Unable to pull image');
  }
}
