angular.module('portainer.docker').controller('BrowseVolumeController', BrowseVolumeController);

/* @ngInject */
function BrowseVolumeController($scope, $transition$, StateManager, endpoint) {
  function initView() {
    $scope.volumeId = $transition$.params().id;
    $scope.nodeName = $transition$.params().nodeName;
    $scope.agentApiVersion = StateManager.getAgentApiVersion();
    $scope.endpointId = endpoint.Id;
  }

  initView();
}
