import { useMemo } from 'react';

import { StorageClass } from '@/react/portainer/environments/types';
import { Registry } from '@/react/portainer/registries/types/registry';

import { NamespaceFormValues, PortainerNamespace } from '../types';
import { megaBytesValue, parseCPU } from '../resourceQuotaUtils';
import { IngressControllerClassMap } from '../../cluster/ingressClass/types';

interface ComputeInitialValuesParams {
  namespaceName: string;
  environmentId: number;
  storageClasses?: StorageClass[];
  namespace?: PortainerNamespace;
  registries?: Registry[];
  ingressClasses?: IngressControllerClassMap[];
}

export function computeInitialValues({
  namespaceName,
  environmentId,
  namespace,
  registries,
  ingressClasses,
}: ComputeInitialValuesParams): NamespaceFormValues | null {
  if (!namespace) {
    return null;
  }
  const memory = namespace.ResourceQuota?.spec?.hard?.['requests.memory'] ?? '';
  const cpu = namespace.ResourceQuota?.spec?.hard?.['requests.cpu'] ?? '';

  const registriesUsed = registries?.filter(
    (registry) =>
      registry.RegistryAccesses?.[`${environmentId}`]?.Namespaces.includes(
        namespaceName
      )
  );

  return {
    name: namespaceName,
    ingressClasses: ingressClasses ?? [],
    resourceQuota: {
      enabled: !!memory || !!cpu,
      memory: `${megaBytesValue(memory)}`,
      cpu: `${parseCPU(cpu)}`,
    },
    registries: registriesUsed ?? [],
  };
}

export function useNamespaceFormValues({
  namespaceName,
  environmentId,
  storageClasses,
  namespace,
  registries,
  ingressClasses,
}: ComputeInitialValuesParams): NamespaceFormValues | null {
  return useMemo(
    () =>
      computeInitialValues({
        namespaceName,
        environmentId,
        storageClasses,
        namespace,
        registries,
        ingressClasses,
      }),
    [
      storageClasses,
      namespace,
      registries,
      namespaceName,
      ingressClasses,
      environmentId,
    ]
  );
}
