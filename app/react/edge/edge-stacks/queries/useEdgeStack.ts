import { useQuery } from 'react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EdgeStack } from '../types';

import { buildUrl } from './buildUrl';
import { queryKeys } from './query-keys';

export function useEdgeStack(id?: EdgeStack['Id']) {
  return useQuery(id ? queryKeys.item(id) : [], () => getEdgeStack(id), {
    ...withError('Failed loading Edge stack'),
    enabled: !!id,
  });
}

export async function getEdgeStack(id?: EdgeStack['Id']) {
  if (!id) {
    return null;
  }

  try {
    const { data } = await axios.get<EdgeStack>(buildUrl(id));
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
