angular.module('portainer.docker')
.controller('NetworksController', ['$scope', '$state', 'NetworkService', 'Notifications', 'HttpRequestHelper', 'EndpointProvider',
function ($scope, $state, NetworkService, Notifications, HttpRequestHelper, EndpointProvider) {

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (network) {
      HttpRequestHelper.setPortainerAgentTargetHeader(network.NodeName);
      NetworkService.remove(network.Id)
      .then(function success() {
        Notifications.success('Network successfully removed', network.Name);
        var index = $scope.networks.indexOf(network);
        $scope.networks.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove network');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  $scope.endpointStatus = 1;

  function initView() {
    NetworkService.networks(true, true, true)
    .then(function success(data) {
      $scope.networks = data;
      $scope.endpointStatus = EndpointProvider.endpointStatus();
    })
    .catch(function error(err) {
      $scope.networks = [];
      Notifications.error('Failure', err, 'Unable to retrieve networks');
    });
  }

  initView();
}]);
