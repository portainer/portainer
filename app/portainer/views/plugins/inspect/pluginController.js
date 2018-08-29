angular.module('portainer.app')
.controller('PluginController', ['$q', '$scope', '$transition$',
function ($q, $scope, $transition$) {

  function initView() {
    $scope.plugin = $transition$.params().plugin;
  }

  initView();
}]);
