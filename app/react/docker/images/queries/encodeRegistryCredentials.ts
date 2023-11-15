import { Registry } from '@/react/portainer/registries/types/registry';

/**
 * Encodes the registry credentials in base64
 * @param registryId
 * @returns
 */
export function encodeRegistryCredentials(registryId: Registry['Id']) {
  const credentials = {
    registryId,
  };

  return window.btoa(JSON.stringify(credentials));
}
