import angular from 'angular';

class EdgeGroupsController {
  /* @ngInject */
  constructor(Notifications, $state, EdgeGroupService) {
    this.Notifications = Notifications;
    this.$state = $state;
    this.EdgeGroupService = EdgeGroupService;

    this.removeAction = this.removeAction.bind(this);
  }

  async $onInit() {
    this.items = await this.EdgeGroupService.groups();
  }

  async removeAction(selectedItems) {
    let actionCount = selectedItems.length;
    for (const item of selectedItems) {
      try {
        await this.EdgeGroupService.remove(item.Id);

        this.Notifications.success('Edge Group successfully removed', item.Name);
        const index = this.items.indexOf(item);
        this.items.splice(index, 1);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove Edge Group');
      } finally {
        actionCount--;
        if (actionCount === 0) {
          this.$state.reload();
        }
      }
    }
  }
}

angular.module('portainer.edge').controller('EdgeGroupsController', EdgeGroupsController);
