angular.module('portainer.helpers', [])
.factory('ImageHelper', [function ImageHelperFactory() {
  'use strict';
  return {
    createImageConfig: function(imageName, registry) {
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
    }
  };
}])
.factory('ContainerHelper', [function ContainerHelperFactory() {
  'use strict';
  return {
    hideContainers: function(containers, containersToHideLabels) {
      return containers.filter(function (container) {
        var filterContainer = false;
        containersToHideLabels.forEach(function(label, index) {
          if (_.has(container.Labels, label.name) &&
          container.Labels[label.name] === label.value) {
            filterContainer = true;
          }
        });
        if (!filterContainer) {
          return container;
        }
      });
    },
  };
}]);
