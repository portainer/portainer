import { useEffect } from 'react';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { useNamespacesQuery } from '../queries/useNamespacesQuery';

type RedirectOptions = {
  to: string;
  params?: Record<string, unknown>;
};

/**
 * Redirects away when the provided namespace is not in the allowed namespaces list for the current environment.
 */
export function useNamespaceAccessRedirect(
  namespace?: string,
  { to, params } = { to: 'kubernetes.dashboard', params: {} } as RedirectOptions
) {
  const router = useRouter();
  const namespaceInParams = useCurrentStateAndParams().params.namespace;
  const currentNamespace = namespace || namespaceInParams;
  const environmentId = useEnvironmentId();

  const namespacesQuery = useNamespacesQuery(environmentId);

  useEffect(() => {
    if (!currentNamespace) {
      return;
    }

    if (namespacesQuery.isLoading || namespacesQuery.isFetching) {
      return;
    }

    const namespaces = namespacesQuery.data ?? [];
    const isAllowed = namespaces.some((ns) => ns.Name === currentNamespace);

    if (!isAllowed) {
      router.stateService.go(to, params);
    }
  }, [
    currentNamespace,
    to,
    params,
    router.stateService,
    namespacesQuery.isLoading,
    namespacesQuery.isFetching,
    namespacesQuery.data,
  ]);
}
