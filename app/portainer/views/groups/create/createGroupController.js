import {EndpointGroupDefaultModel} from '../../../models/group';

angular.module('portainer.app')
.controller('CreateGroupController', ['$q', '$scope', '$state', 'GroupService', 'EndpointService', 'TagService', 'Notifications',
function ($q, $scope, $state, GroupService, EndpointService, TagService, Notifications) {

  $scope.state = {
    actionInProgress: false
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
    TagService.tags()
    .then((tags) => {
      $scope.availableTags = tags;
      $scope.associatedEndpoints = [];
      $scope.model = new EndpointGroupDefaultModel();
      $scope.loaded = true;
    })
    .catch((err) => {
      Notifications.error('Failure', err, 'Unable to retrieve tags');
    });
  }

  initView();
}]);
