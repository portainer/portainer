angular.module('portainer.app')
.controller('EndpointsController', ['$q', '$scope', '$state', 'EndpointService', 'GroupService', 'EndpointHelper', 'Notifications',
function ($q, $scope, $state, EndpointService, GroupService, EndpointHelper, Notifications) {

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (endpoint) {
      EndpointService.deleteEndpoint(endpoint.Id)
      .then(function success() {
        Notifications.success('Endpoint successfully removed', endpoint.Name);
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

  $scope.getPaginatedEndpoints = getPaginatedEndpoints;
  function getPaginatedEndpoints(lastId, limit, filter) {
    const deferred = $q.defer();
    $q.all({
      endpoints: EndpointService.endpoints(lastId, limit, filter),
      groups: GroupService.groups()
    })
    .then(function success(data) {
      var endpoints = data.endpoints.value;
      var groups = data.groups;
      EndpointHelper.mapGroupNameToEndpoint(endpoints, groups);
      deferred.resolve({endpoints: endpoints, totalCount: data.endpoints.totalCount});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint information');
    });
    return deferred.promise;
  }
}]);
