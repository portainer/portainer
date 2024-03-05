import { buildImageFullURIFromModel, imageContainsURL } from '@/react/docker/images/utils';

angular.module('portainer.docker').factory('ImageHelper', ImageHelperFactory);
function ImageHelperFactory() {
  return {
    isValidTag,
    createImageConfigForContainer,
    getImagesNamesForDownload,
    removeDigestFromRepository,
    imageContainsURL,
  };

  function isValidTag(tag) {
    return tag.match(/^(?![\.\-])([a-zA-Z0-9\_\.\-])+$/g);
  }

  /**
   *
   * @param {Array<{tags: Array<string>; id: string;}>} images
   * @returns {{names: string[]}}}
   */
  function getImagesNamesForDownload(images) {
    var names = images.map(function (image) {
      return image.tags[0] !== '<none>:<none>' ? image.tags[0] : image.id;
    });
    return {
      names,
    };
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
