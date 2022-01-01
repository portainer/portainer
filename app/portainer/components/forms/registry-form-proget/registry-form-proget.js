angular.module('portainer.app').component('registryFormProget', {
  templateUrl: './registry-form-proget.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
  },
});
