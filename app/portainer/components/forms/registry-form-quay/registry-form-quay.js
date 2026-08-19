class controller {
  constructor($scope) {
    this.$scope = $scope;
    this.toggleOrganisation = this.toggleOrganisation.bind(this);
  }

  $postLink() {
    this.registryFormQuay.registry_name.$validators.used = (modelValue) => !this.nameIsUsed(modelValue);
  }

  toggleOrganisation(newValue) {
    this.$scope.$evalAsync(() => {
      this.model.Quay.useOrganisation = newValue;
    });
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
