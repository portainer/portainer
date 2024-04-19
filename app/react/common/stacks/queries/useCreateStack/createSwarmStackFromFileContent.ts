import axios, { parseAxiosError } from '@/portainer/services/axios';
import { Pair } from '@/react/portainer/settings/types';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Stack } from '../../types';

import { buildCreateUrl } from './buildUrl';

export interface SwarmFileContentPayload {
  /** Name of the stack */
  name: string;

  stackFileContent: string;
  /** List of environment variables */
  env?: Array<Pair>;

  /** Whether the stack is from an app template */
  fromAppTemplate?: boolean;
  /** A UUID to identify a webhook. The stack will be force updated and pull the latest image when the webhook was invoked. */
  webhook?: string;

  /** Swarm cluster identifier */
  swarmID: string;
  environmentId: EnvironmentId;
}

export async function createSwarmStackFromFileContent({
  environmentId,
  ...payload
}: SwarmFileContentPayload) {
  try {
    const { data } = await axios.post<Stack>(
      buildCreateUrl('swarm', 'string'),
      payload,
      {
        params: { endpointId: environmentId },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
