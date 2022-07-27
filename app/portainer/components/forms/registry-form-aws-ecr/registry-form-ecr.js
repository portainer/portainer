class controller {
  constructor($scope) {
    this.$scope = $scope;
    this.toggleAuthentication = this.toggleAuthentication.bind(this);
  }

  $postLink() {
    this.registryFormEcr.registry_name.$validators.used = (modelValue) => !this.nameIsUsed(modelValue);
  }

  toggleAuthentication(newValue) {
    this.$scope.$evalAsync(() => {
      this.model.Authentication = newValue;
    });
  }
}

angular.module('portainer.app').component('registryFormEcr', {
  templateUrl: './registry-form-ecr.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
    nameIsUsed: '<',
  },
  controller,
});
