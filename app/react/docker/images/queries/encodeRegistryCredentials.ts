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

  const buf = Buffer.from(JSON.stringify(credentials));
  return buf.toString('base64url');
}
