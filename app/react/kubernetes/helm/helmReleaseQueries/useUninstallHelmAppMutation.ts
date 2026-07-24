import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';
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
    ...withError('Unable to uninstall helm application'),
    onSuccess: (_data, { releaseName, namespace }) => {
      // The release is gone. Cancel any in-flight detail/history request for it
      // (e.g. an auto-refresh poll) so it can't resolve into a cosmetic
      // "Release: not found" error toast. We intentionally do NOT invalidate
      // queryKeys.releases here: it is a prefix of the detail and history keys,
      // so invalidating it would refetch the just-deleted release and 404 (C9S-192).
      if (namespace) {
        queryClient.cancelQueries(
          queryKeys.release(environmentId, namespace, releaseName)
        );
        queryClient.cancelQueries(
          queryKeys.releaseHistory(environmentId, namespace, releaseName)
        );
      }
      return queryClient.invalidateQueries(
        applicationsQueryKeys.applications(environmentId)
      );
    },
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
