import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { StackFile, StackId } from '../types';

import { stacksQueryKeys } from './query-keys';
import { buildStackUrl } from './buildUrl';

export function useStackFile(stackId?: StackId) {
  return useQuery(
    stacksQueryKeys.stackFile(stackId || 0),
    () => getStackFile(stackId!),
    {
      ...withError('Unable to retrieve stack'),
      enabled: !!stackId,
    }
  );
}

async function getStackFile(stackId: StackId) {
  try {
    const { data } = await axios.get<StackFile>(buildStackUrl(stackId, 'file'));
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve stack file');
  }
}
