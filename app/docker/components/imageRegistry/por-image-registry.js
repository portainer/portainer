angular.module('portainer.docker').component('porImageRegistry', {
  templateUrl: './por-image-registry.html',
  controller: 'porImageRegistryController',
  bindings: {
    model: '=', // must be of type PorImageRegistryModel
    pullWarning: '<',
    autoComplete: '<',
    labelClass: '@',
    inputClass: '@',
    endpoint: '<',
    isAdmin: '<',
    checkRateLimits: '<',
    onImageChange: '&',
    setValidity: '<',
  },
  require: {
    form: '^form',
  },
  transclude: true,
});
