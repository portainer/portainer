import angular from 'angular';
import _ from 'lodash-es';

angular.module('portainer.edge').controller('EdgeStacksViewController', function EdgeStacksViewController($state, Notifications, EdgeStackService, ModalService, $scope, $async) {
  this.stacks = undefined;

  this.getStacks = getStacks.bind(this);
  this.removeAction = removeAction.bind(this);
  this.removeActionAsync = removeActionAsync.bind(this);

  this.$onInit = function $onInit() {
    this.getStacks();
  };

  function removeAction(stacks) {
    return $async(this.removeActionAsync, stacks);
  }

  async function removeActionAsync(stacks) {
    await Promise.all(
      stacks.map(async (stack) => {
        try {
          await EdgeStackService.remove(stack.Id);
          Notifications.success('Stack successfully removed', stack.Name);
          _.remove(this.stacks, stack);
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to remove stack ' + stack.Name);
        }
      })
    );
    $state.reload();
  }

  async function getStacks() {
    try {
      this.stacks = await EdgeStackService.stacks();
      $scope.$digest();
    } catch (err) {
      this.stacks = [];
      Notifications.error('Failure', err, 'Unable to retrieve stacks');
    }
  }
});
