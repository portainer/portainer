import { useMutation } from '@tanstack/react-query';
import { Pod } from 'kubernetes-types/core/v1';

import { queryClient, withGlobalError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios';

import { parseKubernetesAxiosError } from '../../axiosError';

import { queryKeys } from './query-keys';
import { getPods } from './getPods';

// useRedeployApplicationMutation gets all the pods for an application (using the matchLabels field in the labelSelector query param) and then deletes all of them, so that they are recreated
export function useRedeployApplicationMutation(
  environmentId: number,
  namespace: string,
  name: string
) {
  return useMutation(
    async ({ labelSelector }: { labelSelector: string }) => {
      try {
        // get only the pods that match the labelSelector for the application
        const pods = await getPods(environmentId, namespace, labelSelector);
        // delete all the pods to redeploy the application
        await Promise.all(
          pods.map((pod) => {
            if (pod?.metadata?.name) {
              return deletePod(environmentId, namespace, pod.metadata.name);
            }
            return Promise.resolve();
          })
        );
      } catch (error) {
        throw new Error(`Unable to redeploy application: ${error}`);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(
          queryKeys.application(environmentId, namespace, name)
        );
      },
      ...withGlobalError('Unable to redeploy application'),
    }
  );
}

async function deletePod(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  try {
    return await axios.delete<Pod>(buildUrl(environmentId, namespace, name));
  } catch (e) {
    throw parseKubernetesAxiosError(e as Error, 'Unable to delete pod');
  }
}

function buildUrl(
  environmentId: EnvironmentId,
  namespace: string,
  name?: string
) {
  let baseUrl = `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/pods`;
  if (name) {
    baseUrl += `/${name}`;
  }
  return baseUrl;
}
