import { useMutation, useQueryClient } from '@tanstack/react-query';

import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';
import { withError, withInvalidate } from '@/react-tools/react-query';

import { queryKeys } from './queryKeys';
import { deleteNetwork } from './useDeleteNetworkMutation';

export function useDeleteNetworkListMutation() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      networks,
    }: {
      networks: Array<{ nodeName?: string; id: string }>;
    }) =>
      processItemsInBatches(networks, ({ id, nodeName }) =>
        deleteNetwork(environmentId, id, { nodeName }).then(() =>
          notifySuccess('Network successfully removed', id)
        )
      ),
    ...withInvalidate(queryClient, [queryKeys.base(environmentId)]),
    ...withError('Failed to remove networks'),
  });
}
