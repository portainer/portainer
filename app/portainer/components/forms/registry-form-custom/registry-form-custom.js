angular.module('portainer.app').component('registryFormCustom', {
  templateUrl: 'app/portainer/components/forms/registry-form-custom/registry-form-custom.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<'
  }
});
