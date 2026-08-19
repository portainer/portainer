import { buildImageFullURIFromModel, imageContainsURL, fullURIIntoRepoAndTag } from '@/react/docker/images/utils';

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
   */
  function createImageConfigForContainer(imageModel) {
    const fromImage = buildImageFullURIFromModel(imageModel);
    const { tag, repo } = fullURIIntoRepoAndTag(fromImage);
    return {
      fromImage,
      tag,
      repo,
    };
  }

  function removeDigestFromRepository(repository) {
    return repository.split('@sha')[0];
  }
}
