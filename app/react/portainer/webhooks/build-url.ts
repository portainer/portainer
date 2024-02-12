import { Webhook } from './types';

export function buildUrl(id?: Webhook['Id']) {
  const url = '/webhooks';

  if (id) {
    return `${url}/${id}`;
  }

  return url;
}
