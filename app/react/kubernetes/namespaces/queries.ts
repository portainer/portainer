import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';

import { getNamespaces, getNamespace } from './service';

export function useNamespaces(environmentId: EnvironmentId) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'namespaces'],
    () => getNamespaces(environmentId),
    {
      onError: (err) => {
        notifyError('Failure', err as Error, 'Unable to get namespaces.');
      },
    }
  );
}

export function useNamespace(environmentId: EnvironmentId, namespace: string) {
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
