import uuid from 'uuid';

import {
  API_ENDPOINT_EDGE_STACKS,
  API_ENDPOINT_STACKS,
  API_ENDPOINT_WEBHOOKS,
} from '@/constants';

import { baseHref } from './pathHelper';

const baseUrl = getBaseUrl();

export function dockerWebhookUrl(token: string) {
  return `${baseUrl}${API_ENDPOINT_WEBHOOKS}/${token}`;
}

export function baseStackWebhookUrl() {
  return `${baseUrl}${API_ENDPOINT_STACKS}/webhooks`;
}

export function stackWebhookUrl(token: string) {
  return `${baseStackWebhookUrl()}/${token}`;
}

export function createWebhookId() {
  return uuid();
}

export function baseEdgeStackWebhookUrl() {
  return `${baseUrl}${API_ENDPOINT_EDGE_STACKS}/webhooks`;
}

/* @ngInject */
export function WebhookHelperFactory() {
  return {
    returnWebhookUrl: dockerWebhookUrl,
    getBaseStackWebhookUrl: baseStackWebhookUrl,
    returnStackWebhookUrl: stackWebhookUrl,
  };
}

function getBaseUrl() {
  const protocol = window.location.protocol.toLowerCase().replace(':', '');

  if (protocol === 'file') {
    return baseHref();
  }

  const { hostname } = window.location;
  const port = parseInt(window.location.port, 10);
  const displayPort =
    (protocol === 'http' && port === 80) ||
    (protocol === 'https' && port === 443) ||
    Number.isNaN(port)
      ? ''
      : `:${port}`;
  return `${protocol}://${hostname}${displayPort}${baseHref()}`;
}
