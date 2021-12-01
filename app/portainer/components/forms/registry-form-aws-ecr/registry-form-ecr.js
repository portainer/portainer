angular.module('portainer.app').component('registryFormEcr', {
  templateUrl: './registry-form-ecr.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
  },
});
