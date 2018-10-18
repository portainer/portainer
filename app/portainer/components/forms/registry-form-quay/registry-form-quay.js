angular.module('portainer.app').component('registryFormQuay', {
  templateUrl: 'app/portainer/components/forms/registry-form-quay/registry-form-quay.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<'
  }
});
