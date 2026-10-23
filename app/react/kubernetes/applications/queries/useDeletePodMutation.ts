import { useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { queryClient, withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

export function useDeletePodMutation(
  environmentId: EnvironmentId,
  namespace: string,
  appName: string
) {
  return useMutation(
    ({ podName }: { podName: string }) =>
      deletePod(environmentId, namespace, podName),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(
          queryKeys.applicationPods(environmentId, namespace, appName)
        );
      },
      ...withError('Unable to delete pod'),
    }
  );
}

async function deletePod(
  environmentId: EnvironmentId,
  namespace: string,
  podName: string
) {
  try {
    await axios.delete(
      `/kubernetes/${environmentId}/namespaces/${namespace}/pods/${podName}`
    );
  } catch (error) {
    throw parseAxiosError(
      error as Error,
      `Failed to delete pod ${podName} in namespace ${namespace}`
    );
  }
}
