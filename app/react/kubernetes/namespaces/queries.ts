import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';
import { withError } from '@/react-tools/react-query';

import {
  getNamespaces,
  getNamespace,
  getSelfSubjectAccessReview,
} from './service';
import { Namespaces } from './types';

export function useNamespaces(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'namespaces'],
    async () => {
      const namespaces = await getNamespaces(environmentId);
      const namespaceNames = Object.keys(namespaces);
      // use selfsubjectaccess reviews to avoid forbidden requests
      const allNamespaceAccessReviews = await Promise.all(
        namespaceNames.map((namespaceName) =>
          getSelfSubjectAccessReview(environmentId, namespaceName)
        )
      );
      const allowedNamespacesNames = allNamespaceAccessReviews
        .filter((accessReview) => accessReview.status.allowed)
        .map((accessReview) => accessReview.spec.resourceAttributes.namespace);
      const allowedNamespaces = namespaceNames.reduce((acc, namespaceName) => {
        if (allowedNamespacesNames.includes(namespaceName)) {
          acc[namespaceName] = namespaces[namespaceName];
        }
        return acc;
      }, {} as Namespaces);
      return allowedNamespaces;
    },
    {
      ...withError('Unable to get namespaces.'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
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
