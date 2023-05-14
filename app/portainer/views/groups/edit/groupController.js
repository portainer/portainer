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
      try {
        if (meta.action === 'add') {
          await onAssociate(meta.value);
        } else if (meta.action === 'remove') {
          await onDisassociate(meta.value);
        }

        $scope.associatedEndpoints = value;
        notifySuccess('Success', `Environment successfully ${meta.action === 'add' ? 'added' : 'removed'} to group`);
      } catch (err) {
        notifyError('Failure', err, `Unable to ${meta.action} environment to group`);
      }
    });
  }

  function onAssociate(endpointId) {
    return GroupService.addEndpoint($scope.group.Id, endpointId);
  }

  function onDisassociate(endpointId) {
    return GroupService.removeEndpoint($scope.group.Id, endpointId);
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
