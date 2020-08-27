import _ from 'lodash-es';

export class EdgeStacksViewController {
  /* @ngInject */
  constructor($state, Notifications, EdgeStackService, $scope, $async) {
    this.$state = $state;
    this.Notifications = Notifications;
    this.EdgeStackService = EdgeStackService;
    this.$scope = $scope;
    this.$async = $async;

    this.stacks = undefined;

    this.getStacks = this.getStacks.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
  }

  $onInit() {
    this.getStacks();
  }

  removeAction(stacks) {
    return this.$async(this.removeActionAsync, stacks);
  }

  async removeActionAsync(stacks) {
    for (let stack of stacks) {
      try {
        await this.EdgeStackService.remove(stack.Id);
        this.Notifications.success('Stack successfully removed', stack.Name);
        _.remove(this.stacks, stack);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove stack ' + stack.Name);
      }
    }

    this.$state.reload();
  }

  async getStacks() {
    try {
      this.stacks = await this.EdgeStackService.stacks();
    } catch (err) {
      this.stacks = [];
      this.Notifications.error('Failure', err, 'Unable to retrieve stacks');
    }
  }
}
