import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';

import { getIngresses } from '../ingresses/service';

import { getNamespaces, getNamespace } from './service';
import { Namespaces } from './types';

export function useNamespaces(environmentId: EnvironmentId) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'namespaces'],
    async () => {
      const namespaces = await getNamespaces(environmentId);
      const settledNamespacesPromise = await Promise.allSettled(
        Object.keys(namespaces).map((namespace) =>
          getIngresses(environmentId, namespace).then(() => namespace)
        )
      );
      const ns: Namespaces = {};
      settledNamespacesPromise.forEach((namespace) => {
        if (namespace.status === 'fulfilled') {
          ns[namespace.value] = namespaces[namespace.value];
        }
      });
      return ns;
    },
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
