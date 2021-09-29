angular.module('portainer.docker').component('porImageRegistry', {
  templateUrl: './por-image-registry.html',
  controller: 'porImageRegistryController',
  bindings: {
    model: '=', // must be of type PorImageRegistryModel
    autoComplete: '<',
    labelClass: '@',
    inputClass: '@',
    endpoint: '<',
    serviceInfo: '<',
    isAdmin: '<',
    checkRateLimits: '<',
    onImageChange: '&',
    setValidity: '<',
    namespace: '<',
  },
  require: {
    form: '^form',
  },
  transclude: true,
});
