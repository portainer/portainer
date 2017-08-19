angular.module('portainer').component('porTranslation', {
  bindings: {
    'key': '@',
    'compile': '@'
  },
  template: '<span translate translate-compile="{{ $ctrl.compile ? $ctrl.compile : false }}">{{ $ctrl.key }}</span>'
});
