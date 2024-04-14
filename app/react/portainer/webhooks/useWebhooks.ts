import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';
import { Filters, Webhook } from './types';

export function useWebhooks(
  filters: Filters,
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery(queryKeys.list(filters), () => getWebhooks(filters), {
    enabled,
  });
}

async function getWebhooks(filters: Filters) {
  try {
    const { data } = await axios.get<Array<Webhook>>(buildUrl(), {
      params: { filters: JSON.stringify(filters) },
    });
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'failed fetching webhooks');
  }
}
