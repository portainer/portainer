angular.module('portainer.docker')
.controller('BrowseVolumeController', ['$scope', '$transition$', 'StateManager',
function ($scope, $transition$, StateManager) {

  function initView() {
    $scope.volumeId = $transition$.params().id;
    $scope.nodeName = $transition$.params().nodeName;
    $scope.agentApiVersion = StateManager.getAgentApiVersion();
  }

  initView();
}]);
