import { EnvironmentId } from '../../environments/types';
import { RegistryId } from '../types/registry';

export const queryKeys = {
  base: () => ['registries'] as const,
  list: (environmentId?: EnvironmentId) =>
    [...queryKeys.base(), { environmentId }] as const,
  item: (registryId: RegistryId) => [...queryKeys.base(), registryId] as const,
};
