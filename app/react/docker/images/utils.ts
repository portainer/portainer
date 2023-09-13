import _ from 'lodash';

import { trimSHA } from '@/docker/filters/utils';
import {
  Registry,
  RegistryTypes,
} from '@/react/portainer/registries/types/registry';

import { DockerImage } from './types';
import { DockerImageResponse } from './types/response';

export function parseViewModel(response: DockerImageResponse): DockerImage {
  return {
    ...response,
    Used: false,
    RepoTags:
      response.RepoTags ??
      response.RepoDigests.map((digest) => `${trimSHA(digest)}:<none>`),
  };
}

export function getUniqueTagListFromImages(
  images: Array<{ RepoTags?: string[] }>
) {
  return _.uniq(
    images.flatMap((image) =>
      image.RepoTags
        ? image.RepoTags.filter((item) => !item.includes('<none>'))
        : []
    )
  );
}

export function imageContainsURL(image: string) {
  const split = image.split('/');
  const url = split[0];
  if (split.length > 1) {
    return url.includes('.') || url.includes(':');
  }
  return false;
}

export function buildImageFullURIFromModel(imageModel: {
  UseRegistry: boolean;
  Registry?: Registry;
  Image: string;
}) {
  const registry = imageModel.UseRegistry ? imageModel.Registry : undefined;
  return buildImageFullURI(imageModel.Image, registry);
}

/**
 * builds the complete uri for an image based on its registry
 */
export function buildImageFullURI(image: string, registry?: Registry) {
  if (!registry) {
    return ensureTag(image);
  }

  const imageName = buildImageFullURIWithRegistry(image, registry);

  return ensureTag(imageName);

  function ensureTag(image: string, defaultTag = 'latest') {
    return image.includes(':') ? image : `${image}:${defaultTag}`;
  }
}

function buildImageFullURIWithRegistry(image: string, registry: Registry) {
  switch (registry.Type) {
    case RegistryTypes.GITHUB:
      return buildImageURIForGithub(image, registry);
    case RegistryTypes.GITLAB:
      return buildImageURIForGitLab(image, registry);
    case RegistryTypes.QUAY:
      return buildImageURIForQuay(image, registry);
    case RegistryTypes.ANONYMOUS:
      return image;
    default:
      return buildImageURIForOtherRegistry(image, registry);
  }

  function buildImageURIForGithub(image: string, registry: Registry) {
    const imageName = image.split('/').pop();

    const namespace = registry.Github.UseOrganisation
      ? registry.Github.OrganisationName
      : registry.Username;
    return `${registry.URL}/${namespace}/${imageName}`;
  }

  function buildImageURIForGitLab(image: string, registry: Registry) {
    const slash = image.startsWith(':') ? '' : '/';
    return `${registry.URL}/${registry.Gitlab.ProjectPath}${slash}${image}`;
  }

  function buildImageURIForQuay(image: string, registry: Registry) {
    const name = registry.Quay.UseOrganisation
      ? registry.Quay.OrganisationName
      : registry.Username;
    const url = registry.URL ? `${registry.URL}/` : '';
    return `${url}${name}/${image}`;
  }

  function buildImageURIForOtherRegistry(image: string, registry: Registry) {
    const url = registry.URL ? `${registry.URL}/` : '';
    return url + image;
  }
}
