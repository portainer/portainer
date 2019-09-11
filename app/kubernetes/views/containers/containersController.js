import angular from 'angular';

class KubernetesContainersController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesContainerService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.KubernetesContainerService = KubernetesContainerService;

    this.getContainers = this.getContainers.bind(this);
    this.getContainersAsync = this.getContainersAsync.bind(this);
  }

  async getContainersAsync() {
    try {
      this.containers = await this.KubernetesContainerService.containers();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve containers');
    }
  }

  getContainers() {
    return this.$async(this.getContainersAsync);
  }

  async $onInit() {
    this.getContainers();
  }
}

export default KubernetesContainersController;
angular.module('portainer.kubernetes').controller('KubernetesContainersController', KubernetesContainersController);
