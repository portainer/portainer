import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError, withInvalidate } from '@/react-tools/react-query';
import { queryKeys as applicationsQueryKeys } from '@/react/kubernetes/applications/queries/query-keys';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

export function useUninstallHelmAppMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      releaseName,
      namespace,
    }: {
      releaseName: string;
      namespace?: string;
    }) => uninstallHelmApplication(environmentId, releaseName, namespace),
    ...withInvalidate(queryClient, [
      queryKeys.releases(environmentId),
      applicationsQueryKeys.applications(environmentId),
    ]),
    ...withGlobalError('Unable to uninstall helm application'),
  });
}

export async function uninstallHelmApplication(
  environmentId: EnvironmentId,
  releaseName: string,
  namespace?: string
) {
  try {
    await axios.delete(
      `/endpoints/${environmentId}/kubernetes/helm/${releaseName}`,
      { params: { namespace } }
    );
  } catch (error) {
    // parseAxiosError, because it's a regular portainer api error
    throw parseAxiosError(error, 'Unable to remove application');
  }
}
