import { SecretList } from 'kubernetes-types/core/v1';
import { useMutation, useQuery } from 'react-query';

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

export const secretQueryKeys = {
  secrets: (environmentId: EnvironmentId, namespace?: string) => [
    'environments',
    environmentId,
    'kubernetes',
    'secrets',
    'namespaces',
    namespace,
  ],
  secretsForCluster: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'secrets',
  ],
};

// returns a usequery hook for the list of secrets from the kubernetes API
export function useSecrets(environmentId: EnvironmentId, namespace?: string) {
  return useQuery(
    secretQueryKeys.secrets(environmentId, namespace),
    () => (namespace ? getSecrets(environmentId, namespace) : []),
    {
      onError: (err) => {
        notifyError(
          'Failure',
          err as Error,
          `Unable to get secrets in namespace '${namespace}'`
        );
      },
      enabled: !!namespace,
    }
  );
}

export function useSecretsForCluster(
  environmentId: EnvironmentId,
  namespaces?: string[],
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    secretQueryKeys.secretsForCluster(environmentId),
    () => namespaces && getSecretsForCluster(environmentId, namespaces),
    {
      ...withError('Unable to retrieve secrets for cluster'),
      enabled: !!namespaces?.length,
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

export function useMutationDeleteSecrets(environmentId: EnvironmentId) {
  return useMutation(
    async (secrets: { namespace: string; name: string }[]) => {
      const promises = await Promise.allSettled(
        secrets.map(({ namespace, name }) =>
          deleteSecret(environmentId, namespace, name)
        )
      );
      const successfulSecrets = promises
        .filter(isFulfilled)
        .map((_, index) => secrets[index].name);
      const failedSecrets = promises
        .filter(isRejected)
        .map(({ reason }, index) => ({
          name: secrets[index].name,
          reason,
        }));
      return { failedSecrets, successfulSecrets };
    },
    {
      ...withError('Unable to remove secrets'),
      onSuccess: ({ failedSecrets, successfulSecrets }) => {
        queryClient.invalidateQueries(
          secretQueryKeys.secretsForCluster(environmentId)
        );
        // show an error message for each secret that failed to delete
        failedSecrets.forEach(({ name, reason }) => {
          notifyError(
            `Failed to remove secret '${name}'`,
            new Error(reason.message) as Error
          );
        });
        // show one summary message for all successful deletes
        if (successfulSecrets.length) {
          notifySuccess(
            `${pluralize(
              successfulSecrets.length,
              'Secret'
            )} successfully removed`,
            successfulSecrets.join(', ')
          );
        }
      },
    }
  );
}

async function getSecretsForCluster(
  environmentId: EnvironmentId,
  namespaces: string[]
) {
  try {
    const secrets = await Promise.all(
      namespaces.map((namespace) => getSecrets(environmentId, namespace))
    );
    return secrets.flat();
  } catch (e) {
    throw parseKubernetesAxiosError(
      e as Error,
      'Unable to retrieve secrets for cluster'
    );
  }
}

// get all secrets for a namespace
async function getSecrets(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<SecretList>(
      buildUrl(environmentId, namespace)
    );
    return data.items;
  } catch (e) {
    throw parseKubernetesAxiosError(e as Error, 'Unable to retrieve secrets');
  }
}

async function deleteSecret(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  try {
    await axios.delete(buildUrl(environmentId, namespace, name));
  } catch (e) {
    throw parseKubernetesAxiosError(e as Error, 'Unable to remove secret');
  }
}

function buildUrl(environmentId: number, namespace: string, name?: string) {
  const url = `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/secrets`;
  return name ? `${url}/${name}` : url;
}
