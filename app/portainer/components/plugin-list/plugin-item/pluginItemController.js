angular.module('portainer.app')
.controller('PluginItemController', ['$state',
function ($state) {

  var ctrl = this;
  ctrl.$onInit = $onInit;
  ctrl.goToPluginView = goToPluginView;

  function goToPluginView() {
    $state.go('portainer.plugins.plugin', { id: ctrl.model.Id });
  }

  function $onInit() {
    if (ctrl.currentDate === ctrl.model.LicenseExpiration) {
      ctrl.model.Expired = true;
    }
  }
}]);
