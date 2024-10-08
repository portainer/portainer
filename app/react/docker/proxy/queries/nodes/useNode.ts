import { Node } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';

/**
 * Raw docker API proxy
 * @param environmentId
 * @param id
 * @returns
 */
export async function getNode(
  environmentId: EnvironmentId,
  id: NonNullable<Node['ID']>
) {
  try {
    const { data } = await axios.get<Node>(
      buildDockerProxyUrl(environmentId, 'nodes', id)
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve node');
  }
}
