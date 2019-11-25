angular.module('portainer.docker').component('porImageRegistry', {
  templateUrl: './porImageRegistry.html',
  controller: 'porImageRegistryController',
  bindings: {
    'model': '=', // must be of type PorImageRegistryModel
    'pullWarning': '<',
    'labelClass': '@',
    'inputClass': '@'
  },
  require: {
    form: '^form'
  }
});
