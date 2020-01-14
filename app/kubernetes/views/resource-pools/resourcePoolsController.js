import angular from 'angular';

class KubernetesResourcePoolsController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesResourcePoolService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;

    this.getResourcePools = this.getResourcePools.bind(this);
    this.getResourcePoolsAsync = this.getResourcePoolsAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
  }

  async removeActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const pool of selectedItems) {
      try {
        await this.KubernetesResourcePoolService.remove(pool);
        this.Notifications.success('Resource pool successfully removed', pool.Namespace.Name);
        const index = this.resourcePools.indexOf(pool);
        this.resourcePools.splice(index, 1);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove resource pool');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload();
        }
      }
    }
  }

  removeAction(selectedItems) {
    return this.$async(this.removeActionAsync, selectedItems);
  }

  async getResourcePoolsAsync() {
    try {
      this.resourcePools = await this.KubernetesResourcePoolService.resourcePools();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retreive resource pools');
    }
  }

  getResourcePools() {
    return this.$async(this.getResourcePoolsAsync)
  }

  $onInit() {
    this.getResourcePools();
  }
}

export default KubernetesResourcePoolsController;
angular.module('portainer.kubernetes').controller('KubernetesResourcePoolsController', KubernetesResourcePoolsController);