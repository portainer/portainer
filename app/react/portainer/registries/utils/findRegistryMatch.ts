import { Registry, RegistryId, RegistryTypes } from '../types/registry';

import { getURL } from './getUrl';

/**
 *  findBestMatchRegistry finds out the best match registry for repository
 * matching precedence:
 * 1. registryId matched
 * 2. both domain name and username matched (for dockerhub only)
 * 3. only URL matched
 * 4. pick up the first dockerhub registry
 */
export function findBestMatchRegistry(
  repository: string,
  registries: Array<Registry>,
  registryId?: RegistryId
) {
  if (registryId) {
    return registries.find((r) => r.Id === registryId);
  }

  const matchDockerByUserAndUrl = registries.find(
    (r) =>
      r.Type === RegistryTypes.DOCKERHUB &&
      (repository.startsWith(`${r.Username}/`) ||
        repository.startsWith(`${getURL(r)}/${r.Username}/`))
  );

  if (matchDockerByUserAndUrl) {
    return matchDockerByUserAndUrl;
  }

  const matchByUrl = registries.find((r) => repository.startsWith(getURL(r)));

  if (matchByUrl) {
    return matchByUrl;
  }

  return registries.find((r) => r.Type === RegistryTypes.DOCKERHUB);
}
