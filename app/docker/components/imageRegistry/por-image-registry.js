angular.module('portainer.docker').component('porImageRegistry', {
  templateUrl: './porImageRegistry.html',
  controller: 'porImageRegistryController',
  bindings: {
    model: '=', // must be of type PorImageRegistryModel
    pullWarning: '<',
    autoComplete: '<',
    labelClass: '@',
    inputClass: '@',
    onImageChange: '&',
  },
  require: {
    form: '^form',
  },
});
