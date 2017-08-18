angular.module('portainer').component('porTranslation', {
  bindings: {
    'key': '@'
  },
  template: '<span translate>{{ $ctrl.key }}</span>'
});
