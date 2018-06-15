angular.module('portainer.app')
.controller('GroupController', ['$q', '$scope', '$state', '$transition$', 'GroupService', 'EndpointService', 'TagService', 'Notifications',
function ($q, $scope, $state, $transition$, GroupService, EndpointService, TagService, Notifications) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.update = function() {
    var model = $scope.group;

    var associatedEndpoints = [];
    for (var i = 0; i < $scope.associatedEndpoints.length; i++) {
      var endpoint = $scope.associatedEndpoints[i];
      associatedEndpoints.push(endpoint.Id);
    }

    $scope.state.actionInProgress = true;
    GroupService.updateGroup(model, associatedEndpoints)
    .then(function success(data) {
      Notifications.success('Group successfully updated');
      $state.go('portainer.groups', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update group');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  function initView() {
    var groupId = $transition$.params().id;

    $q.all({
      group: GroupService.group(groupId),
      endpoints: EndpointService.endpoints(),
      tags: TagService.tagNames()
    })
    .then(function success(data) {
      $scope.group = data.group;

      var availableEndpoints = [];
      var associatedEndpoints = [];
      for (var i = 0; i < data.endpoints.length; i++) {
        var endpoint = data.endpoints[i];
        if (endpoint.GroupId === +groupId) {
          associatedEndpoints.push(endpoint);
        } else if (endpoint.GroupId === 1) {
          availableEndpoints.push(endpoint);
        }
      }

      $scope.availableEndpoints = availableEndpoints;
      $scope.associatedEndpoints = associatedEndpoints;
      $scope.availableTags = data.tags;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load view');
    });
  }

  initView();
}]);
