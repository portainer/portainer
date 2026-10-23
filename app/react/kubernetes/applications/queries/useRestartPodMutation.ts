import { useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { queryClient, withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys } from './query-keys';

export function useRestartPodMutation(
  environmentId: EnvironmentId,
  namespace: string,
  appName: string
) {
  return useMutation(
    ({ podName }: { podName: string }) =>
      restartPod(environmentId, namespace, podName),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(
          queryKeys.applicationPods(environmentId, namespace, appName)
        );
      },
      ...withError('Unable to restart pod'),
    }
  );
}

async function restartPod(
  environmentId: EnvironmentId,
  namespace: string,
  podName: string
) {
  try {
    await axios.post(
      `/kubernetes/${environmentId}/namespaces/${namespace}/pods/${podName}/restart`
    );
  } catch (error) {
    throw parseAxiosError(
      error as Error,
      `Failed to restart pod ${podName} in namespace ${namespace}`
    );
  }
}
