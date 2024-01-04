import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EnvironmentId } from '../environments/types';
import { RegistryId } from '../registries/types/registry';

import { buildUrl } from './build-url';
import { Webhook, WebhookType } from './types';

interface CreateWebhookPayload {
  ResourceId: string;
  EndpointID: EnvironmentId;
  RegistryId?: RegistryId;
  WebhookType: WebhookType;
}

export async function createWebhook(payload: CreateWebhookPayload) {
  try {
    const { data } = await axios.post<Webhook>(buildUrl(), payload);
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to create webhook');
  }
}
