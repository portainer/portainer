angular.module('portainer.app').component('registryFormCustom', {
  templateUrl: './registry-form-custom.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<'
  }
});
