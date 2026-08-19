import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Webhook } from '@/react/portainer/webhooks/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { queryKeys } from './query-keys';

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ webhookId }: { webhookId: Webhook['Id'] }) =>
      deleteWebhook(webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });
    },
    ...withError('Failed to delete webhook'),
  });
}

async function deleteWebhook(webhookId: Webhook['Id']) {
  try {
    await axios.delete(`/webhooks/${webhookId}`);
  } catch (err) {
    throw parseAxiosError(err, 'Failed to delete webhook');
  }
}
