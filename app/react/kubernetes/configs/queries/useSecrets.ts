import { useQuery } from '@tanstack/react-query';
import { Secret, SecretList } from 'kubernetes-types/core/v1';

import { withGlobalError } from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { parseKubernetesAxiosError } from '../../axiosError';

import { secretQueryKeys } from './query-keys';

// returns a usequery hook for the list of secrets from the kubernetes API
export function useSecrets(environmentId: EnvironmentId, namespace?: string) {
  return useQuery(
    secretQueryKeys.secrets(environmentId, namespace),
    () => (namespace ? getSecrets(environmentId, namespace) : []),
    {
      ...withGlobalError(`Unable to get secrets in namespace '${namespace}'`),
      enabled: !!namespace,
    }
  );
}

// get all secrets for a namespace
async function getSecrets(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<SecretList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/secrets`
    );
    // when fetching a list, the kind isn't appended to the items, so we need to add it
    const secrets: Secret[] = data.items.map((secret) => ({
      ...secret,
      kind: 'Secret',
    }));
    return secrets;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve secrets');
  }
}
