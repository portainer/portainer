angular.module('portainer.app').component('registryFormAzure', {
  templateUrl: 'app/portainer/components/forms/registry-form-azure/registry-form-azure.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<'
  }
});
