angular.module('portainer.app')
.controller('ProductItemController', ['$state',
function ($state) {

  var ctrl = this;
  ctrl.$onInit = $onInit;
  ctrl.goToExtensionView = goToExtensionView;

  function goToExtensionView() {
    $state.go('portainer.extensions.extension', { id: ctrl.model.Id });
  }

  function $onInit() {
    if (ctrl.currentDate === ctrl.model.LicenseExpiration) {
      ctrl.model.Expired = true;
    }
  }
}]);
