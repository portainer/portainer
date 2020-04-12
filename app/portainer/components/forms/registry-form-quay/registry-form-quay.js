angular.module('portainer.app').component('registryFormQuay', {
  templateUrl: './registry-form-quay.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
  },
});
