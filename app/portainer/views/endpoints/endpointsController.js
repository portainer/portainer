angular.module('portainer.app')
.controller('EndpointsController', ['$q', '$scope', '$state', 'EndpointService', 'GroupService', 'EndpointHelper', 'Notifications',
function ($q, $scope, $state, EndpointService, GroupService, EndpointHelper, Notifications) {

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
    $q.all({
      endpoints: EndpointService.endpoints(),
      groups: GroupService.groups()
    })
    .then(function success(data) {
      var endpoints = data.endpoints;
      var groups = data.groups;
      EndpointHelper.mapGroupNameToEndpoint(endpoints, groups);
      $scope.groups = groups;
      $scope.endpoints = endpoints;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load view');
    });
  }

  initView();
}]);
