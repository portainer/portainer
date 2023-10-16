import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { CustomTemplate } from '../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './build-url';

export async function getCustomTemplates() {
  try {
    const { data } = await axios.get<CustomTemplate[]>(buildUrl());
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get custom templates');
  }
}

export function useCustomTemplates<T = Array<CustomTemplate>>({
  select,
}: { select?(templates: Array<CustomTemplate>): T } = {}) {
  return useQuery(queryKeys.base(), () => getCustomTemplates(), {
    select,
    ...withGlobalError('Unable to retrieve custom templates'),
  });
}
