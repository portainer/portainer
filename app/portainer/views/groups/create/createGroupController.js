angular.module('portainer.app')
.controller('CreateGroupController', ['$scope', '$state', 'GroupService', 'EndpointService', 'Notifications',
function ($scope, $state, GroupService, EndpointService, Notifications) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.addLabel = function() {
    $scope.model.Labels.push({ name: '', value: '' });
  };

  $scope.removeLabel = function(index) {
    $scope.model.Labels.splice(index, 1);
  };

  $scope.create = function() {
    var model = $scope.model;

    var associatedEndpoints = [];
    for (var i = 0; i < $scope.associatedEndpoints.length; i++) {
      var endpoint = $scope.associatedEndpoints[i];
      associatedEndpoints.push(endpoint.Id);
    }

    $scope.state.actionInProgress = true;
    GroupService.createGroup(model, associatedEndpoints)
    .then(function success() {
      Notifications.success('Group successfully created');
      $state.go('portainer.groups', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create group');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  function initView() {
    $scope.model = new EndpointGroupDefaultModel();

    EndpointService.endpointsByGroup(1)
    .then(function success(data) {
      $scope.availableEndpoints = data;
      $scope.associatedEndpoints = [];
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoints');
    });
  }

  initView();
}]);
