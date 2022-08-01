class controller {
  constructor($scope) {
    this.$scope = $scope;
    this.toggleAuthentication = this.toggleAuthentication.bind(this);
  }

  $postLink() {
    this.registryFormCustom.registry_name.$validators.used = (modelValue) => !this.nameIsUsed(modelValue);
  }

  toggleAuthentication(newValue) {
    this.$scope.$evalAsync(() => {
      this.model.Authentication = newValue;
    });
  }
}

angular.module('portainer.app').component('registryFormCustom', {
  templateUrl: './registry-form-custom.html',
  bindings: {
    model: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
    nameIsUsed: '<',
  },
  controller,
});
