class controller {
  $postLink() {
    this.registryFormDockerhub.registry_name.$validators.used = (modelValue) => !this.nameIsUsed(modelValue);
  }
}

angular.module('portainer.app').component('registryFormDockerhub', {
  templateUrl: './registry-form-dockerhub.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
    nameIsUsed: '<',
  },
  controller,
});
