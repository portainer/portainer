import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';
import { StackType } from '@/react/common/stacks/types';

import { CustomTemplate } from '../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './build-url';

type Params = {
  type?: StackType[];
  /**
   * filter edge templates
   * true if should show only edge templates
   * false if should show only non-edge templates
   * undefined if should show all templates
   */
  edge?: boolean;
};

export { type Params as CustomTemplatesListParams };

export function useCustomTemplates<T = Array<CustomTemplate>>({
  select,
  params,
}: { params?: Params; select?(templates: Array<CustomTemplate>): T } = {}) {
  return useQuery(queryKeys.list(params), () => getCustomTemplates(params), {
    select,
    ...withGlobalError('Unable to retrieve custom templates'),
  });
}

async function getCustomTemplates({ type, edge }: Params = {}) {
  try {
    const { data } = await axios.get<CustomTemplate[]>(buildUrl(), {
      params: {
        // deconstruct to make sure we don't pass other params
        type,
        edge,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get custom templates');
  }
}
