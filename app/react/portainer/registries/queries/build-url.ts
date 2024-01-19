import { RegistryId } from '../types/registry';

export function buildUrl(registryId: RegistryId) {
  const base = '/registries';

  if (registryId) {
    return `${base}/${registryId}`;
  }

  return base;
}

export function buildProxyUrl(registryId: RegistryId) {
  return `${buildUrl(registryId)}/v2`;
}
