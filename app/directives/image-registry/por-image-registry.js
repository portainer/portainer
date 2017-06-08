angular.module('portainer').component('porImageRegistry', {
  templateUrl: 'app/directives/image-registry/porImageRegistry.html',
  controller: 'porImageRegistryController',
  bindings: {
    'image': '=',
    'registry': '='
  }
});
