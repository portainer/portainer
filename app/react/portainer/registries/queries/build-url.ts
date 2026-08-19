import { RegistryId } from '../types/registry';

export function buildUrl(registryId: RegistryId, resource?: 'repositories') {
  let url = '/registries';

  if (registryId) {
    url += `/${registryId}`;
  }

  if (resource) {
    url += `/${resource}`;
  }

  return url;
}

export function buildProxyUrl(registryId: RegistryId) {
  return `${buildUrl(registryId)}/v2`;
}
