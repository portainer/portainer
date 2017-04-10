angular.module('portainer.helpers')
.factory('ImageHelper', [function ImageHelperFactory() {
  'use strict';
  return {
    createImageConfigForCommit: function(imageName, registry) {
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
    },
    createImageConfigForContainer: function (imageName, registry) {
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
    }
  };
}]);
