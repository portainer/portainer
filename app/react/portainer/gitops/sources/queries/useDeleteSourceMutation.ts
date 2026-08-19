import { useMutation, useQueryClient } from '@tanstack/react-query';

import { gitOpsSourcesDelete } from '@api/sdk.gen';

import { withError } from '@/react-tools/react-query';

import { Source } from '../types';

import { sourceQueryKeys } from './query-keys';

async function deleteSource(id: Source['id']): Promise<void> {
  await gitOpsSourcesDelete({ path: { id } });
}

export function useDeleteSourceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSource,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: sourceQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sourceQueryKeys.all });
    },
    ...withError('Unable to delete source'),
  });
}
