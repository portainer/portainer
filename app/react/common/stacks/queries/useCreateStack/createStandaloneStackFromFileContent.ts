import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { Pair } from '@/react/portainer/settings/types';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { RegistryId } from '@/react/portainer/registries/types/registry';

import { Stack } from '../../types';

import { buildCreateUrl } from './buildUrl';

export interface StandaloneFileContentPayload {
  /** Name of the stack */
  name: string;

  stackFileContent: string;
  /** List of environment variables */
  env?: Array<Pair> | null;

  /** Whether the stack is from an app template */
  fromAppTemplate?: boolean;
  /** A UUID to identify a webhook. The stack will be force updated and pull the latest image when the webhook was invoked. */
  webhook?: string;
  environmentId: EnvironmentId;
  registries?: Array<RegistryId>;
}

export async function createStandaloneStackFromFileContent({
  environmentId,
  ...payload
}: StandaloneFileContentPayload) {
  try {
    const { data } = await axios.post<Stack>(
      buildCreateUrl('standalone', 'string'),
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
