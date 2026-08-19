import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { EnvironmentId } from '../environments/types';
import { RegistryId } from '../registries/types/registry';

import { buildUrl } from './build-url';
import { Webhook, WebhookType } from './types';
import { queryKeys } from './query-keys';

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
    ...withError('Failed to create webhook'),
  });
}

export async function createWebhook({
  environmentId,
  ...payload
}: {
  resourceId: string;
  environmentId: EnvironmentId;
  registryId?: RegistryId;
  webhookType: WebhookType;
}) {
  try {
    const { data } = await axios.post<Webhook>(buildUrl(), {
      endpointId: environmentId,
      ...payload,
    });
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to create webhook');
  }
}
