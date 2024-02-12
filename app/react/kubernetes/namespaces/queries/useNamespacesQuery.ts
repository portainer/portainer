import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Namespaces } from '../types';
import { getSelfSubjectAccessReview } from '../getSelfSubjectAccessReview';

export function useNamespacesQuery(
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

// getNamespaces is used to retrieve namespaces using the Portainer backend with caching
async function getNamespaces(environmentId: EnvironmentId) {
  try {
    const { data: namespaces } = await axios.get<Namespaces>(
      `kubernetes/${environmentId}/namespaces`
    );
    return namespaces;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve namespaces');
  }
}
