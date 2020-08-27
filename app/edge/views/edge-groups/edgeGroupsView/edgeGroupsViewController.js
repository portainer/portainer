import _ from 'lodash-es';

export class EdgeGroupsController {
  /* @ngInject */
  constructor($async, $state, EdgeGroupService, Notifications) {
    this.$async = $async;
    this.$state = $state;
    this.EdgeGroupService = EdgeGroupService;
    this.Notifications = Notifications;

    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
  }

  async $onInit() {
    try {
      this.items = await this.EdgeGroupService.groups();
    } catch (err) {
      this.items = [];
      this.Notifications.error('Failure', err, 'Unable to retrieve Edge groups');
    }
  }

  removeAction(selectedItems) {
    return this.$async(this.removeActionAsync, selectedItems);
  }

  async removeActionAsync(selectedItems) {
    for (let item of selectedItems) {
      try {
        await this.EdgeGroupService.remove(item.Id);

        this.Notifications.success('Edge Group successfully removed', item.Name);
        _.remove(this.items, item);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove Edge Group');
      }
    }

    this.$state.reload();
  }
}
