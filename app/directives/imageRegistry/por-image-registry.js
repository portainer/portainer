angular.module('portainer').component('porImageRegistry', {
  templateUrl: 'app/directives/imageRegistry/porImageRegistry.html',
  controller: 'porImageRegistryController',
  bindings: {
    'image': '=',
    'registry': '=',
    'autoComplete': '<'
  }
});
