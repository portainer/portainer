import { EndpointGroupDefaultModel } from '../../../models/group';

angular.module('portainer.app').controller('CreateGroupController', function CreateGroupController($async, $scope, $state, GroupService, Notifications) {
  $scope.state = {
    actionInProgress: false,
  };

  $scope.onChangeEnvironments = onChangeEnvironments;

  $scope.create = function () {
    var model = $scope.model;

    $scope.state.actionInProgress = true;
    GroupService.createGroup(model, $scope.associatedEndpoints)
      .then(function success() {
        Notifications.success('Success', 'Group successfully created');
        $state.go('portainer.groups', {}, { reload: true });
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to create group');
      })
      .finally(function final() {
        $scope.state.actionInProgress = false;
      });
  };

  function initView() {
    $scope.associatedEndpoints = [];
    $scope.model = new EndpointGroupDefaultModel();
    $scope.loaded = true;
  }

  function onChangeEnvironments(value) {
    return $scope.$evalAsync(() => {
      $scope.associatedEndpoints = value;
    });
  }

  initView();
});
