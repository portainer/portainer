import angular from 'angular';

class KubernetesResourcePoolsController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesResourcePoolService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;

    this.getResourcePools = this.getResourcePools.bind(this);
    this.getResourcePoolsAsync = this.getResourcePoolsAsync.bind(this);
  }

  async getResourcePoolsAsync() {
    try {
      this.resourcePools = await this.KubernetesResourcePoolService.pools();
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