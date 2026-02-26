import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withGlobalError, withInvalidate } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { disassociateEndpoint } from '@/react/portainer/environments/environment.service';

import { environmentQueryKeys } from '../../queries/query-keys';

export function useDisassociateEnvironment(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disassociateEndpoint(environmentId),
    ...withGlobalError('Failed to disassociate environment'),
    ...withInvalidate(queryClient, [environmentQueryKeys.item(environmentId)]),
  });
}
