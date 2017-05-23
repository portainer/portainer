angular.module('portainer.helpers')
.factory('ImageHelper', [function ImageHelperFactory() {
  'use strict';

  var helper = {};

  helper.extractImageAndRegistryFromTag = function(tag) {
    var slashCount = _.countBy(tag)['/'];
    var registry = null;
    var image = tag;
    if (slashCount > 1) {
      // assume something/some/thing[/...]
      var registryAndImage = _.split(tag, '/');
      registry = registryAndImage[0];
      image = registryAndImage[1];
    }

    return {
      registry: registry,
      image: image
    };
  };

  helper.createImageConfigForCommit = function(imageName, registry) {
    var imageNameAndTag = imageName.split(':');
    var image = imageNameAndTag[0];
    if (registry) {
      image = registry + '/' + imageNameAndTag[0];
    }
    var imageConfig = {
      repo: image,
      tag: imageNameAndTag[1] ? imageNameAndTag[1] : 'latest'
    };
    return imageConfig;
  };

  helper.createImageConfigForContainer = function (imageName, registry) {
    var imageNameAndTag = imageName.split(':');
    var image = imageNameAndTag[0];
    if (registry) {
      image = registry + '/' + imageNameAndTag[0];
    }
    var imageConfig = {
      fromImage: image,
      tag: imageNameAndTag[1] ? imageNameAndTag[1] : 'latest'
    };
    return imageConfig;
  };

  return helper;
}]);
