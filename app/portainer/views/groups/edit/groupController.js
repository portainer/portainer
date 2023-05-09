import _ from 'lodash';
import { getEnvironments } from '@/react/portainer/environments/environment.service';

angular.module('portainer.app').controller('GroupController', function GroupController($q, $scope, $state, $transition$, GroupService, Notifications) {
  $scope.state = {
    actionInProgress: false,
  };
  $scope.onAssociate = onAssociate;
  $scope.onDisassociate = onDisassociate;
  $scope.associatedEndpoints = [];

  $scope.update = function () {
    var model = $scope.group;

    $scope.state.actionInProgress = true;
    GroupService.updateGroup(model)
      .then(function success() {
        Notifications.success('Success', 'Group successfully updated');
        $state.go('portainer.groups', {}, { reload: true });
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to update group');
      })
      .finally(function final() {
        $scope.state.actionInProgress = false;
      });
  };

  function onAssociate(endpointId) {
    return GroupService.addEndpoint($scope.group.Id, endpointId)
      .then(() => {
        $scope.associatedEndpoints = [...$scope.associatedEndpoints, endpointId];
        Notifications.success('Success', 'Environment successfully added to group');
      })
      .catch((err) => Notifications.error('Error', err, 'Unable to add environment to group'));
  }

  function onDisassociate(endpointId) {
    return GroupService.removeEndpoint($scope.group.Id, endpointId)
      .then(() => {
        $scope.associatedEndpoints = _.without($scope.associatedEndpoints, endpointId);
        Notifications.success('Success', 'Environment successfully removed from group');
      })
      .catch((err) => Notifications.error('Error', err, 'Unable to remove environment from group'));
  }

  function initView() {
    var groupId = $transition$.params().id;

    $q.all({
      group: GroupService.group(groupId),
      endpoints: getEnvironments({ query: { groupIds: [groupId] } }),
    })
      .then(function success(data) {
        $scope.group = data.group;
        $scope.associatedEndpoints = data.endpoints.value.map((endpoint) => endpoint.Id);
        $scope.loaded = true;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to load group details');
      });
  }

  initView();
});
