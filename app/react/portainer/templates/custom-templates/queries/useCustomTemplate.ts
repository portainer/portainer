import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { CustomTemplate } from '../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './build-url';

export async function getCustomTemplate(id: CustomTemplate['Id']) {
  try {
    const { data } = await axios.get<CustomTemplate>(buildUrl({ id }));
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get custom template');
  }
}

export function useCustomTemplate(
  id?: CustomTemplate['Id'],
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery(queryKeys.item(id!), () => getCustomTemplate(id!), {
    ...withGlobalError('Unable to retrieve custom template'),
    enabled: !!id && enabled,
  });
}
