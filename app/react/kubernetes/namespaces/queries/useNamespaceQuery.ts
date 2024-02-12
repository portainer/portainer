import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { notifyError } from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { DefaultOrSystemNamespace } from '../types';

export function useNamespaceQuery(
  environmentId: EnvironmentId,
  namespace: string
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'namespaces', namespace],
    () => getNamespace(environmentId, namespace),
    {
      onError: (err) => {
        notifyError('Failure', err as Error, 'Unable to get namespace.');
      },
    }
  );
}

// getNamespace is used to retrieve a namespace using the Portainer backend
export async function getNamespace(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: ns } = await axios.get<DefaultOrSystemNamespace>(
      `kubernetes/${environmentId}/namespaces/${namespace}`
    );
    return ns;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve namespace');
  }
}
