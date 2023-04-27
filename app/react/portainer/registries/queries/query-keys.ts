import { RegistryId } from '../types/registry';

export const queryKeys = {
  base: () => ['registries'] as const,
  item: (registryId: RegistryId) => [...queryKeys.base(), registryId] as const,
};
