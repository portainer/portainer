import { Secret, SecretList } from 'kubernetes-types/core/v1';
import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';

import { parseKubernetesAxiosError } from '../../axiosError';

export const secretQueryKeys = {
  secrets: (environmentId: EnvironmentId, namespace?: string) => [
    'environments',
    environmentId,
    'kubernetes',
    'secrets',
    'namespaces',
    namespace,
  ],
};

/**
 * returns a usequery hook for the list of secrets from the kubernetes API
 */
export function useK8sSecrets(
  environmentId: EnvironmentId,
  namespace?: string
) {
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

// get all secrets for a namespace
async function getSecrets(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<SecretList>(
      buildUrl(environmentId, namespace)
    );
    const secretsWithKind: Secret[] = data.items.map((secret) => ({
      ...secret,
      kind: 'Secret',
    }));
    return secretsWithKind;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve secrets');
  }
}

function buildUrl(environmentId: number, namespace: string, name?: string) {
  const url = `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/secrets`;
  return name ? `${url}/${name}` : url;
}
