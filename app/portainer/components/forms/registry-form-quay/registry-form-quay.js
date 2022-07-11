class controller {
  $postLink() {
    this.registryFormQuay.registry_name.$validators.used = (modelValue) => !this.nameIsUsed(modelValue);
  }
}

angular.module('portainer.app').component('registryFormQuay', {
  templateUrl: './registry-form-quay.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
    nameIsUsed: '<',
  },
  controller,
});
