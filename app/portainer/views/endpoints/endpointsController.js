angular.module('portainer.app')
.controller('EndpointsController', ['$scope', '$state', 'EndpointService', 'Notifications',
function ($scope, $state, EndpointService, Notifications) {

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (endpoint) {
      EndpointService.deleteEndpoint(endpoint.Id)
      .then(function success() {
        Notifications.success('Endpoint successfully removed', endpoint.Name);
        var index = $scope.endpoints.indexOf(endpoint);
        $scope.endpoints.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove endpoint');
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
    EndpointService.endpoints()
    .then(function success(data) {
      $scope.endpoints = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoints');
    });
  }

  initView();
}]);
