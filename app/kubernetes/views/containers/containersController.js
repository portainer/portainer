import angular from 'angular';

class KubernetesContainersController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesPodService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.KubernetesPodService = KubernetesPodService;

    this.getPods = this.getPods.bind(this);
    this.getPodsAsync = this.getPodsAsync.bind(this);
  }

  async getPodsAsync() {
    try {
      this.pods = await this.KubernetesPodService.pods();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve pods');
    }
  }

  getPods() {
    return this.$async(this.getPodsAsync);
  }

  async $onInit() {
    this.getPods();
  }
}

export default KubernetesContainersController;
angular.module('portainer.kubernetes').controller('KubernetesContainersController', KubernetesContainersController);
