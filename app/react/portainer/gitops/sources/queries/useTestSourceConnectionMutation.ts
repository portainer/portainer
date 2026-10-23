import { useMutation } from '@tanstack/react-query';

import { type SourcesConnectionTestResult } from '@api/types.gen';
import { gitOpsSourcesTestById } from '@api/sdk.gen';

import { withError } from '@/react-tools/react-query';

import { Source } from '../types';

import { UpdateSourcePayload } from './useUpdateSourceMutation';

export type ConnectionTestResult = SourcesConnectionTestResult;

async function testSourceConnection(
  id: Source['id'],
  payload: UpdateSourcePayload
): Promise<ConnectionTestResult> {
  const { data } = await gitOpsSourcesTestById({ path: { id }, body: payload });
  return data;
}

export function useTestSourceConnectionMutation() {
  return useMutation({
    mutationFn: ({
      id,
      payload = {},
    }: {
      id: Source['id'];
      payload?: UpdateSourcePayload;
    }) => testSourceConnection(id, payload),
    ...withError('Connection test failed'),
  });
}
