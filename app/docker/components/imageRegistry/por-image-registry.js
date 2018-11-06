angular.module('portainer.docker').component('porImageRegistry', {
  templateUrl: './porImageRegistry.html',
  controller: 'porImageRegistryController',
  bindings: {
    'image': '=',
    'registry': '=',
    'autoComplete': '<',
    'labelClass': '@',
    'inputClass': '@'
  },
  require: {
    form: '^form'
  }
});
