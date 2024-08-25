import { buildImageFullURIFromModel, imageContainsURL } from '@/react/docker/images/utils';

angular.module('portainer.docker').factory('ImageHelper', ImageHelperFactory);
function ImageHelperFactory() {
  return {
    isValidTag,
    createImageConfigForContainer,
    removeDigestFromRepository,
    imageContainsURL,
  };

  function isValidTag(tag) {
    return tag.match(/^(?![\.\-])([a-zA-Z0-9\_\.\-])+$/g);
  }

  /**
   *
   * @param {PorImageRegistryModel} registry
   * @returns {ImageConfig}
   * @typedef ImageConfig = {
   *  fromImage: string; // full image URI (including tag)
   *  repo: string; // image URI without tag
   *  tag: string;  // image tag
   * }
   */
  function createImageConfigForContainer(imageModel) {
    const fromImage = buildImageFullURIFromModel(imageModel);
    // possible fromImage values:
    // - registry/image-repo:tag
    // - image-repo:tag
    // - registry:port/image-repo:tag
    // buildImageFullURIFromModel always gives a tag (defaulting to 'latest'), so the tag is always present after the last ':'
    const parts = fromImage.split(':');
    const tag = parts.pop() || 'latest';
    const repo = parts.join(':');
    return {
      fromImage: buildImageFullURIFromModel(imageModel),
      repo,
      tag,
    };
  }

  function removeDigestFromRepository(repository) {
    return repository.split('@sha')[0];
  }
}
