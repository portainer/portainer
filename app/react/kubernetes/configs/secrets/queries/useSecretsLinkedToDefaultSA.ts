import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { Registry } from '@/react/portainer/registries/types/registry';

/** get all secrets linked to the default service account in the namespace using the registry access settings */
export function useSecretsLinkedToDefaultSA(namespace: string) {
  const environmentId = useEnvironmentId();
  return useEnvironmentRegistries(environmentId, {
    select: (registries) =>
      filterRegistrySecretNamesForNamespace(registries, namespace),
  });

  function filterRegistrySecretNamesForNamespace(
    registries: Registry[],
    namespace: string
  ) {
    return registries
      .filter((registry) =>
        registry.RegistryAccesses?.[environmentId]?.Namespaces?.includes(
          namespace
        )
      )
      .map((registry) => `registry-${registry.Id}`);
  }
}
