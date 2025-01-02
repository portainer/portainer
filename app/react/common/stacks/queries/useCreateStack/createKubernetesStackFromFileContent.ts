import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Stack } from '../../types';

import { buildCreateUrl } from './buildUrl';

export interface KubernetesFileContentPayload {
  /** Name of the stack */
  stackName: string;
  /** Content of the Stack file */
  stackFileContent: string;
  composeFormat: boolean;
  namespace: string;
  /** Whether the stack is from an app template */
  fromAppTemplate?: boolean;
  environmentId: EnvironmentId;
}

export async function createKubernetesStackFromFileContent({
  environmentId,
  ...payload
}: KubernetesFileContentPayload) {
  try {
    const { data } = await axios.post<Stack>(
      buildCreateUrl('kubernetes', 'string'),
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
