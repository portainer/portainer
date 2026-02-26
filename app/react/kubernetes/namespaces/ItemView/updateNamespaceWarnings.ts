import { Registry } from '@/react/portainer/registries/types/registry';

import { ResourceQuotaFormValues } from '../components/NamespaceForm/ResourceQuotaFormSection/types';
import { IngressControllerClassMap } from '../../cluster/ingressClass/types';

export function hasResourceQuotaBeenReduced(
  newResourceQuota: ResourceQuotaFormValues,
  initialResourceQuota?: ResourceQuotaFormValues
) {
  if (!initialResourceQuota) {
    return false;
  }
  // if the new value is an empty string or '0', it's counted as 'unlimited'
  const unlimitedValue = String(Number.MAX_SAFE_INTEGER);
  return (
    (Number(initialResourceQuota.cpu) || unlimitedValue) >
      (Number(newResourceQuota.cpu) || unlimitedValue) ||
    (Number(initialResourceQuota.memory) || unlimitedValue) >
      (Number(newResourceQuota.memory) || unlimitedValue)
  );
}

export function hasNamespaceAccessBeenRemoved(
  newRegistries: Registry[],
  initialRegistries: Registry[],
  environmentId: number,
  namespaceName: string
) {
  return initialRegistries.some((oldRegistry) => {
    // Check if the namespace was in the old registry's accesses
    const isNamespaceInOldAccesses =
      oldRegistry.RegistryAccesses?.[`${environmentId}`]?.Namespaces.includes(
        namespaceName
      );

    if (!isNamespaceInOldAccesses) {
      return false;
    }

    // Find the corresponding new registry
    const newRegistry = newRegistries.find((r) => r.Id === oldRegistry.Id);
    if (!newRegistry) {
      return true;
    }

    // If the registry no longer exists or the namespace is not in its accesses, access has been removed
    const isNamespaceInNewAccesses =
      newRegistry.RegistryAccesses?.[`${environmentId}`]?.Namespaces.includes(
        namespaceName
      );

    return !isNamespaceInNewAccesses;
  });
}

export function hasIngressClassesBeenRemoved(
  newIngressClasses: IngressControllerClassMap[],
  initialIngressClasses: IngressControllerClassMap[]
) {
  // go through all old classes and check if their availability has changed
  return initialIngressClasses.some((oldClass) => {
    const newClass = newIngressClasses.find((c) => c.Name === oldClass.Name);
    return newClass?.Availability !== oldClass.Availability;
  });
}
