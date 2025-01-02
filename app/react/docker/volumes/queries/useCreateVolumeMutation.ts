import { Volume } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { withAgentTargetHeader } from '../../proxy/queries/utils';

export type VolumeConfiguration = {
  Name?: Volume['Name']; // docker auto generates if empty
  Driver?: Volume['Driver']; // docker uses "local" if empty
  DriverOpts?: Volume['Options'];
  Labels?: Volume['Labels'];
};

export async function createVolume(
  environmentId: EnvironmentId,
  volumeConfiguration: VolumeConfiguration,
  { nodeName }: { nodeName: string }
) {
  try {
    const { data } = await axios.post<Volume>(
      buildDockerProxyUrl(environmentId, 'volumes', 'create'),
      volumeConfiguration,
      {
        headers: {
          'X-Portainer-VolumeName': volumeConfiguration.Name,
          ...withAgentTargetHeader(nodeName),
        },
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to create volume');
  }
}
