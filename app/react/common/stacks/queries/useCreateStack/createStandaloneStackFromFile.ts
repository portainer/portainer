import axios, {
  json2formData,
  parseAxiosError,
} from '@/portainer/services/axios';
import { Pair } from '@/react/portainer/settings/types';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Stack } from '../../types';

import { buildCreateUrl } from './buildUrl';

export type StandaloneFileUploadPayload = {
  /** Name of the stack */
  Name: string;

  file: File;
  /** List of environment variables */
  Env?: Array<Pair>;

  /** A UUID to identify a webhook. The stack will be force updated and pull the latest image when the webhook was invoked. */
  Webhook?: string;
  environmentId: EnvironmentId;
};

export async function createStandaloneStackFromFile({
  environmentId,
  ...payload
}: StandaloneFileUploadPayload) {
  try {
    const { data } = await axios.post<Stack>(
      buildCreateUrl('standalone', 'file'),
      json2formData(payload),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: { endpointId: environmentId },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
