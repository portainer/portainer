import angular from 'angular';
import _ from 'lodash-es';
import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

angular.module('portainer.app').controller('GroupsController', GroupsController);

function GroupsController($scope, $state, $async, GroupService, Notifications) {
  $scope.removeAction = removeAction;

  function removeAction(selectedItems) {
    return $async(removeActionAsync, selectedItems);
  }

  async function removeActionAsync(selectedItems) {
    const confirmed = await confirmDestructive({
      title: 'Are you sure?',
      message: 'Are you sure you want to remove the selected environment group(s)?',
      confirmButton: buildConfirmButton('Remove', 'danger'),
    });

    if (!confirmed) {
      return;
    }

    for (let group of selectedItems) {
      try {
        await GroupService.deleteGroup(group.Id);

        Notifications.success('Environment group successfully removed', group.Name);
        _.remove($scope.groups, group);
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to remove group');
      }
    }

    $state.reload();
  }

  function initView() {
    GroupService.groups()
      .then(function success(data) {
        $scope.groups = data;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve environment groups');
        $scope.groups = [];
      });
  }

  initView();
}
