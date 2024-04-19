import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { StackFile, StackId } from './types';

const queryKeys = {
  stackFile: (stackId?: StackId) => ['stacks', stackId, 'file'],
};

export function useStackFile(stackId?: StackId) {
  return useQuery(queryKeys.stackFile(stackId), () => getStackFile(stackId), {
    ...withError('Unable to retrieve stack'),
    enabled: !!stackId,
  });
}

async function getStackFile(stackId?: StackId) {
  if (!stackId) {
    return Promise.resolve(undefined);
  }
  const { data } = await axios.get<StackFile>(`/stacks/${stackId}/file`);
  return data;
}
