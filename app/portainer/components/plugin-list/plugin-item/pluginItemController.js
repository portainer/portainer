angular.module('portainer.app')
.controller('PluginItemController', ['$state',
function ($state) {

  var ctrl = this;
  ctrl.goToPluginView = goToPluginView;

  function goToPluginView() {
    $state.go('portainer.plugins.plugin', { id: ctrl.model.Id });
  }
}]);
