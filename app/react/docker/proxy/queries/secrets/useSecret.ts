import { Secret } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { PortainerResponse } from '@/react/docker/types';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';

export async function getSecret(
  environmentId: EnvironmentId,
  id: NonNullable<Secret['ID']>
) {
  try {
    const { data } = await axios.get<PortainerResponse<Secret>>(
      buildDockerProxyUrl(environmentId, 'secrets', id)
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve secret');
  }
}
