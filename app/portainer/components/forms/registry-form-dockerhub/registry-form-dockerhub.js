angular.module('portainer.app').component('registryFormDockerhub', {
  templateUrl: './registry-form-dockerhub.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
  },
});
