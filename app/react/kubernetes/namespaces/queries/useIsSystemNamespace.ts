import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { PortainerNamespace } from '../types';

import { useNamespaceQuery } from './useNamespaceQuery';

export function useIsSystemNamespace(namespace: string, enabled = true) {
  const envId = useEnvironmentId();
  const query = useNamespaceQuery(envId, namespace, {
    select: (namespace) => namespace.IsSystem,
    enabled,
  });

  return !!query.data;
}

export function isSystemNamespace(
  namespaceName: string,
  namespaces?: PortainerNamespace[]
) {
  return namespaces?.some(
    (namespace) => namespace.Name === namespaceName && namespace.IsSystem
  );
}
