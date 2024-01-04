import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { promiseSequence } from '@/portainer/helpers/promise-utils';

import { getWebhooks } from './getWebhooks';
import { Webhook } from './types';
import { buildUrl } from './build-url';

export async function removeWebhooksForService(
  environmentId: EnvironmentId,
  serviceId: string
) {
  const webhooks = await getWebhooks(environmentId, serviceId);
  return promiseSequence(
    webhooks.map((webhook) => () => removeWebhook(webhook.Id))
  );
}

export async function removeWebhook(webhookId: Webhook['Id']) {
  try {
    await axios.delete(buildUrl(webhookId));
  } catch (err) {
    throw parseAxiosError(err);
  }
}
