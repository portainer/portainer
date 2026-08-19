import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@uirouter/react';

import { withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { removeContainer } from '../../../containers.service';
import { ContainerId } from '../../../types';
import { queryKeys as containerQueryKeys } from '../../../queries/query-keys';

interface RemoveContainerParams {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
  removeVolumes?: boolean;
}

export function useRemoveContainer() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      environmentId,
      containerId,
      nodeName,
      removeVolumes,
    }: RemoveContainerParams) =>
      removeContainer(environmentId, containerId, { nodeName, removeVolumes }),
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({
        queryKey: containerQueryKeys.container(
          variables.environmentId,
          variables.containerId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: containerQueryKeys.list(variables.environmentId),
      });
      router.stateService.go('^');
    },
    ...withError('Unable to remove container'),
  });
}
