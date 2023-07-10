import { imageContainsURL } from '@/react/docker/images/utils';

import { ImageConfigValues } from '@@/ImageConfigFieldset';

import { Registry, RegistryId } from '../types/registry';

import { findBestMatchRegistry } from './findRegistryMatch';
import { getURL } from './getUrl';

export function getDefaultImageConfig(): ImageConfigValues {
  return {
    registryId: 0,
    image: '',
    useRegistry: true,
  };
}

export function getImageConfig(
  repository: string,
  registries: Registry[],
  registryId?: RegistryId
): ImageConfigValues {
  const registry = findBestMatchRegistry(repository, registries, registryId);
  if (registry) {
    const url = getURL(registry);
    let lastIndex = repository.lastIndexOf(url);
    lastIndex = lastIndex === -1 ? 0 : lastIndex + url.length;
    let image = repository.substring(lastIndex);
    if (image.startsWith('/')) {
      image = image.substring(1);
    }

    return {
      useRegistry: true,
      image,
      registryId: registry.Id,
    };
  }
  return {
    image: repository,
    useRegistry: imageContainsURL(repository),
  };
}
