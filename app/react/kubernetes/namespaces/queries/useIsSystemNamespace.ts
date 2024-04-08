import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { useNamespaceQuery } from './useNamespaceQuery';

export function useIsSystemNamespace(namespace: string) {
  const envId = useEnvironmentId();
  const query = useNamespaceQuery(envId, namespace, {
    select: (namespace) => namespace.IsSystem,
  });

  return !!query.data;
}
