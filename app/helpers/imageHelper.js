angular.module('portainer.helpers')
.factory('ImageHelper', [function ImageHelperFactory() {
  'use strict';

  var helper = {};

  helper.extractImageAndRegistryFromRepository = function(repository) {
    var slashCount = _.countBy(repository)['/'];
    var registry = null;
    var image = repository;
    if (slashCount > 1) {
      // assume something/some/thing[/...]
      registry = repository.substr(0, repository.indexOf('/'));
      image = repository.substr(repository.indexOf('/') + 1);
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
