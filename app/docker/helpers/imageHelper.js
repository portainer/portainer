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
   */
  function createImageConfigForContainer(imageModel) {
    return {
      fromImage: buildImageFullURIFromModel(imageModel),
    };
  }

  function removeDigestFromRepository(repository) {
    return repository.split('@sha')[0];
  }
}
