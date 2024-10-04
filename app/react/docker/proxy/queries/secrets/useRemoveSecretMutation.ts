import { Secret } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';

export async function removeSecret(
  environmentId: EnvironmentId,
  id: NonNullable<Secret['ID']>
) {
  try {
    await axios.delete(buildDockerProxyUrl(environmentId, 'secrets', id));
  } catch (err) {
    throw parseAxiosError(err, 'Unable to remove secret');
  }
}
