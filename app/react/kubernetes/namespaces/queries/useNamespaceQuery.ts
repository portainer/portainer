import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { notifyError } from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { PortainerNamespace } from '../types';

import { queryKeys } from './queryKeys';

export function useNamespaceQuery<T = PortainerNamespace>(
  environmentId: EnvironmentId,
  namespace: string,
  {
    select,
  }: {
    select?(namespace: PortainerNamespace): T;
  } = {}
) {
  return useQuery(
    queryKeys.namespace(environmentId, namespace),
    () => getNamespace(environmentId, namespace),
    {
      onError: (err) => {
        notifyError('Failure', err as Error, 'Unable to get namespace.');
      },
      select,
    }
  );
}

// getNamespace is used to retrieve a namespace using the Portainer backend
export async function getNamespace(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: ns } = await axios.get<PortainerNamespace>(
      `kubernetes/${environmentId}/namespaces/${namespace}`
    );
    return ns;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve namespace');
  }
}
