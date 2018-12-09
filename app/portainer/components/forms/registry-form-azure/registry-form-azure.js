angular.module('portainer.app').component('registryFormAzure', {
  templateUrl: './registry-form-azure.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<'
  }
});
