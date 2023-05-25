import _ from 'lodash-es';
import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

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
    const confirmed = await confirmDestructive({
      title: 'Are you sure?',
      message: 'Are you sure you want to remove the selected Edge stack(s)?',
      confirmButton: buildConfirmButton('Remove', 'danger'),
    });

    if (!confirmed) {
      return;
    }

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

  aggregateStatus() {
    if (this.stacks) {
      this.stacks.forEach((stack) => {
        const aggregateStatus = { ok: 0, error: 0, acknowledged: 0 };
        for (let endpointId in stack.Status) {
          const { Details } = stack.Status[endpointId];
          aggregateStatus.ok += Number(Details.Ok);
          aggregateStatus.error += Number(Details.Error);
          aggregateStatus.acknowledged += Number(Details.Acknowledged);
        }
        stack.aggregateStatus = aggregateStatus;
      });
    }
  }

  async getStacks() {
    try {
      this.stacks = await this.EdgeStackService.stacks();
      this.aggregateStatus();
    } catch (err) {
      this.stacks = [];
      this.Notifications.error('Failure', err, 'Unable to retrieve stacks');
    }
  }
}
