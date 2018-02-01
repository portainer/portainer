angular.module('portainer.docker')
.factory('ImageHelper', [function ImageHelperFactory() {
  'use strict';

  var helper = {};

  helper.extractImageAndRegistryFromRepository = function(repository) {
    var slashCount = _.countBy(repository)['/'];
    var registry = null;
    var image = repository;
    if (slashCount >= 1) {
      // assume something/something[/...]
      registry = repository.substr(0, repository.indexOf('/'));
      // assume valid DNS name or IP (contains at least one '.')
      if (_.countBy(registry)['.'] > 0) {
        image = repository.substr(repository.indexOf('/') + 1);
      } else {
        registry = null;
      }
    }

    return {
      registry: registry,
      image: image
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
