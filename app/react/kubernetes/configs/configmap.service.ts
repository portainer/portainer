import { ConfigMap, ConfigMapList } from 'kubernetes-types/core/v1';
import { useMutation, useQuery } from '@tanstack/react-query';

import { queryClient, withError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  error as notifyError,
  notifySuccess,
} from '@/portainer/services/notifications';
import { isFulfilled, isRejected } from '@/portainer/helpers/promise-utils';
import { pluralize } from '@/portainer/helpers/strings';

import { parseKubernetesAxiosError } from '../axiosError';

export const configMapQueryKeys = {
  configMaps: (environmentId: EnvironmentId, namespace?: string) => [
    'environments',
    environmentId,
    'kubernetes',
    'configmaps',
    'namespaces',
    namespace,
  ],
  configMapsForCluster: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'configmaps',
  ],
};

// returns a usequery hook for the list of configmaps from the kubernetes API
export function useConfigMaps(
  environmentId: EnvironmentId,
  namespace?: string
) {
  return useQuery(
    configMapQueryKeys.configMaps(environmentId, namespace),
    () => (namespace ? getConfigMaps(environmentId, namespace) : []),
    {
      onError: (err) => {
        notifyError(
          'Failure',
          err as Error,
          `Unable to get ConfigMaps in namespace '${namespace}'`
        );
      },
      enabled: !!namespace,
    }
  );
}

export function useConfigMapsForCluster(
  environmentId: EnvironmentId,
  namespaces?: string[],
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    configMapQueryKeys.configMapsForCluster(environmentId),
    () => namespaces && getConfigMapsForCluster(environmentId, namespaces),
    {
      ...withError('Unable to retrieve ConfigMaps for cluster'),
      enabled: !!namespaces?.length,
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

export function useMutationDeleteConfigMaps(environmentId: EnvironmentId) {
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
      ...withError('Unable to remove ConfigMaps'),
      onSuccess: ({ failedConfigMaps, successfulConfigMaps }) => {
        // Promise.allSettled can also resolve with errors, so check for errors here
        queryClient.invalidateQueries(
          configMapQueryKeys.configMapsForCluster(environmentId)
        );
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
      },
    }
  );
}

async function getConfigMapsForCluster(
  environmentId: EnvironmentId,
  namespaces: string[]
) {
  const configMaps = await Promise.all(
    namespaces.map((namespace) => getConfigMaps(environmentId, namespace))
  );
  return configMaps.flat();
}

// get all configmaps for a namespace
async function getConfigMaps(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<ConfigMapList>(
      buildUrl(environmentId, namespace)
    );
    const configMapsWithKind: ConfigMap[] = data.items.map((configmap) => ({
      ...configmap,
      kind: 'ConfigMap',
    }));
    return configMapsWithKind;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve ConfigMaps');
  }
}

async function deleteConfigMap(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  try {
    await axios.delete(buildUrl(environmentId, namespace, name));
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to remove ConfigMap');
  }
}

function buildUrl(environmentId: number, namespace: string, name?: string) {
  const url = `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/configmaps`;
  return name ? `${url}/${name}` : url;
}
