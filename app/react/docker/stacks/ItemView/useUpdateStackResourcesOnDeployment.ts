import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Stack, StackStatus } from '@/react/common/stacks/types';
import { queryKeys as dockerQueryKeys } from '@/react/docker/queries/utils';

/**
 * Hook to invalidate related Docker queries when a stack finishes deploying.
 *
 * This encapsulates the previous pattern of keeping a ref to the previous
 * stack status and invalidating the docker root query for the environment
 * when the stack transitions from Deploying -> not Deploying.
 */
export function useUpdateStackResourcesOnDeployment(stack?: Stack) {
  const queryClient = useQueryClient();
  const prevStatusRef = useRef<StackStatus | undefined>(undefined);

  const status = stack?.Status;
  const endpointId = stack?.EndpointId;
  const id = stack?.Id;

  useEffect(() => {
    if (!id) {
      return;
    }

    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (
      prev === StackStatus.Deploying &&
      status !== StackStatus.Deploying &&
      endpointId !== undefined
    ) {
      queryClient.invalidateQueries(dockerQueryKeys.root(endpointId));
    }
  }, [status, endpointId, id, queryClient]);
}

export default useUpdateStackResourcesOnDeployment;
