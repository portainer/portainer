angular.module('portainer.docker')
.factory('ImageHelper', [function ImageHelperFactory() {
  'use strict';

  var helper = {};

  helper.extractImageAndRegistryFromRepository = function(repository) {
    return (_.countBy(repository)['/'] > 1) ?
      { // assume <registry>/[<repo>/<name>:<tag>]
        registry: repository.substr(0, repository.indexOf('/')),
        image: repository.substr(repository.indexOf('/') + 1)
      }
    :
      {
        registry: null,
        image: repository
      };
  };

  function extractNameAndTag(imageName, registry) {
    var imageNameAndTag = imageName.split(':');
    var image = imageNameAndTag[0];
    var tag = imageNameAndTag[1] ? imageNameAndTag[1] : 'latest';
    if (registry) {
      image = registry + '/' + imageNameAndTag[0];
    }

    return {
      image: image,
      tag: tag
    };
  }

  helper.createImageConfigForCommit = function(imageName, registry) {
    var imageAndTag = extractNameAndTag(imageName, registry);
    return {
      repo: imageAndTag.image,
      tag: imageAndTag.tag
    };
  };

  helper.createImageConfigForContainer = function (imageName, registry) {
    var imageAndTag = extractNameAndTag(imageName, registry);
    return {
      fromImage: imageAndTag.image,
      tag: imageAndTag.tag
    };
  };

  return helper;
}]);
