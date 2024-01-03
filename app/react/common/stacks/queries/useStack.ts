import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { Stack, StackId } from '../types';

import { stacksQueryKeys } from './query-keys';
import { buildStackUrl } from './buildUrl';

export function useStack(stackId?: StackId) {
  return useQuery(
    stacksQueryKeys.stackFile(stackId || 0),
    () => getStack(stackId!),
    {
      ...withError('Unable to retrieve stack'),
      enabled: !!stackId,
    }
  );
}

async function getStack(stackId: StackId) {
  try {
    const { data } = await axios.get<Stack>(buildStackUrl(stackId));
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve stack');
  }
}
