import { useQuery } from 'react-query';

import axios from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { Stack, StackFile, StackId } from '../types';

import { stacksQueryKeys } from './query-keys';
import { buildStackUrl } from './buildUrl';

export function useStackQuery(stackId?: StackId) {
  return useQuery(
    stacksQueryKeys.stackFile(stackId || 0),
    () => getStack(stackId),
    {
      ...withError('Unable to retrieve stack'),
      enabled: !!stackId,
    }
  );
}

async function getStack(stackId?: StackId) {
  if (!stackId) {
    return Promise.resolve(undefined);
  }
  const { data } = await axios.get<Stack>(buildStackUrl(stackId));
  return data;
}

export function useStackFileQuery(stackId?: StackId) {
  return useQuery(
    stacksQueryKeys.stackFile(stackId || 0),
    () => getStackFile(stackId),
    {
      ...withError('Unable to retrieve stack'),
      enabled: !!stackId,
    }
  );
}

async function getStackFile(stackId?: StackId) {
  if (!stackId) {
    return Promise.resolve(undefined);
  }
  const { data } = await axios.get<StackFile>(buildStackUrl(stackId, 'file'));
  return data;
}
