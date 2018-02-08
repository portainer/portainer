angular.module('portainer.docker')
.controller('NetworksController', ['$scope', '$state', 'NetworkService', 'Notifications',
function ($scope, $state, NetworkService, Notifications) {

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (network) {
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

  function initView() {
    NetworkService.networks(true, true, true, true)
    .then(function success(data) {
      $scope.networks = data;
    })
    .catch(function error(err) {
      $scope.networks = [];
      Notifications.error('Failure', err, 'Unable to retrieve networks');
    });
  }

  initView();
}]);
