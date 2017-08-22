angular.module('portainer').component('porTranslation', {
  bindings: {
    'key': '@',
    'compile': '@',
    'values': '<'
  },
  template: '<span translate translate-compile="{{ $ctrl.compile ? $ctrl.compile : false }}" translate-values="{{ $ctrl.values }}">{{ $ctrl.key }}</span>'
});
