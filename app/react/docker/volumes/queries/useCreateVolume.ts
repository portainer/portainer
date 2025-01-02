import { Volume, VolumeCreateOptions } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl } from './build-url';

export async function createVolume(
  environmentId: EnvironmentId,
  volume: VolumeCreateOptions
) {
  try {
    const { data } = await axios.post<Volume>(
      buildUrl(environmentId, { action: 'create' }),
      volume,
      {
        headers: {
          'X-Portainer-VolumeName': volume.Name || '',
        },
      }
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}
