import { RegistryId } from '../types/registry';

export function buildUrl(registryId: RegistryId) {
  const base = '/registries';

  if (registryId) {
    return `${base}/${registryId}`;
  }

  return base;
}
