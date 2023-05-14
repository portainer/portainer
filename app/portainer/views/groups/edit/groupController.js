import { getEnvironments } from '@/react/portainer/environments/environment.service';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';

angular.module('portainer.app').controller('GroupController', function GroupController($async, $q, $scope, $state, $transition$, GroupService, Notifications) {
  $scope.state = {
    actionInProgress: false,
  };
  $scope.onChangeEnvironments = onChangeEnvironments;
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

  function onChangeEnvironments(value, meta) {
    return $async(async () => {
      let success = false;
      if (meta.type === 'add') {
        success = await onAssociate(meta.value);
      } else if (meta.type === 'remove') {
        success = await onDisassociate(meta.value);
      }

      if (success) {
        $scope.associatedEndpoints = value;
      }
    });
  }

  async function onAssociate(endpointId) {
    try {
      await GroupService.addEndpoint($scope.group.Id, endpointId);

      notifySuccess('Success', `Environment successfully added to group`);
      return true;
    } catch (err) {
      notifyError('Failure', err, `Unable to add environment to group`);
    }
  }

  async function onDisassociate(endpointId) {
    try {
      await GroupService.removeEndpoint($scope.group.Id, endpointId);

      notifySuccess('Success', `Environment successfully removed to group`);
      return true;
    } catch (err) {
      notifyError('Failure', err, `Unable to remove environment to group`);
    }
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
