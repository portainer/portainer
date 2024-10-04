import { SecretSpec } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';

export async function createSecret(
  environmentId: EnvironmentId,
  secret: SecretSpec
) {
  try {
    const { data } = await axios.post(
      buildDockerProxyUrl(environmentId, 'secrets', 'create'),
      secret
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to create secret');
  }
}
