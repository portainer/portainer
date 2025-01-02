import { Volume } from 'docker-types/generated/1.41';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { withAgentTargetHeader } from '../../proxy/queries/utils';

export async function removeVolume(
  environmentId: EnvironmentId,
  name: Volume['Name'],
  { nodeName }: { nodeName: string }
) {
  try {
    await axios.delete(buildDockerProxyUrl(environmentId, 'volumes', name), {
      headers: {
        ...withAgentTargetHeader(nodeName),
      },
    });
  } catch (e) {
    throw parseAxiosError(e, 'Unable to remove volume');
  }
}
