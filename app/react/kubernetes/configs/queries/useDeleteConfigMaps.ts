import { useMutation } from '@tanstack/react-query';

import { queryClient, withGlobalError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  error as notifyError,
  notifySuccess,
} from '@/portainer/services/notifications';
import { isFulfilled, isRejected } from '@/portainer/helpers/promise-utils';
import { pluralize } from '@/portainer/helpers/strings';

import { parseKubernetesAxiosError } from '../../axiosError';

import { configMapQueryKeys } from './query-keys';

export function useDeleteConfigMaps(environmentId: EnvironmentId) {
  return useMutation(
    async (configMaps: { namespace: string; name: string }[]) => {
      const promises = await Promise.allSettled(
        configMaps.map(({ namespace, name }) =>
          deleteConfigMap(environmentId, namespace, name)
        )
      );
      const successfulConfigMaps = promises
        .filter(isFulfilled)
        .map((_, index) => configMaps[index].name);
      const failedConfigMaps = promises
        .filter(isRejected)
        .map(({ reason }, index) => ({
          name: configMaps[index].name,
          reason,
        }));
      return { failedConfigMaps, successfulConfigMaps };
    },
    {
      ...withGlobalError('Unable to remove ConfigMaps'),
      onSuccess: ({ failedConfigMaps, successfulConfigMaps }) => {
        // Promise.allSettled can also resolve with errors, so check for errors here
        // show an error message for each configmap that failed to delete
        failedConfigMaps.forEach(({ name, reason }) => {
          notifyError(
            `Failed to remove ConfigMap '${name}'`,
            new Error(reason.message) as Error
          );
        });
        // show one summary message for all successful deletes
        if (successfulConfigMaps.length) {
          notifySuccess(
            `${pluralize(
              successfulConfigMaps.length,
              'ConfigMap'
            )} successfully removed`,
            successfulConfigMaps.join(', ')
          );
        }
        queryClient.invalidateQueries({
          queryKey: configMapQueryKeys.configMapsForCluster(environmentId),
        });
      },
    }
  );
}

async function deleteConfigMap(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  try {
    await axios.delete(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/configmaps/${name}`
    );
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to remove ConfigMap');
  }
}
