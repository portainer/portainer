import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Stack } from '../../types';

import { buildCreateUrl } from './buildUrl';

export interface KubernetesUrlPayload {
  stackName: string;
  composeFormat: boolean;
  namespace: string;
  manifestURL: string;
  environmentId: EnvironmentId;
}

export async function createKubernetesStackFromUrl({
  environmentId,
  ...payload
}: KubernetesUrlPayload) {
  try {
    const { data } = await axios.post<Stack>(
      buildCreateUrl('kubernetes', 'url'),
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
