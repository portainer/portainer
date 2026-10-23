import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type SourcesSourceAccess } from '@api/types.gen';
import { gitOpsSourcesUpdateAccess } from '@api/sdk.gen';

import { withError } from '@/react-tools/react-query';

import { Source } from '../types';

import { sourceQueryKeys } from './query-keys';

export type UpdateSourceAccessPayload = SourcesSourceAccess;

async function updateSourceAccess(
  id: Source['id'],
  payload: UpdateSourceAccessPayload
): Promise<void> {
  await gitOpsSourcesUpdateAccess({
    path: { id },
    body: payload,
  });
}

export function useUpdateSourceAccessMutation(id: Source['id']) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSourceAccessPayload) =>
      updateSourceAccess(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: sourceQueryKeys.detail(id),
      }),
    ...withError('Unable to update source access'),
  });
}
