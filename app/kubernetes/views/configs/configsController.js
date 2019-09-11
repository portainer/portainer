import angular from 'angular';

class KubernetesConfigsController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesConfigService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.KubernetesConfigService = KubernetesConfigService;

    this.getConfigs = this.getConfigs.bind(this);
    this.getConfigsAsync = this.getConfigsAsync.bind(this);
  }

  async getConfigsAsync() {
    try {
      this.configs = await this.KubernetesConfigService.configs();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve configs');
    }
  }

  getConfigs() {
    return this.$async(this.getConfigsAsync);
  }

  async $onInit() {
    this.getConfigs();
  }
}

export default KubernetesConfigsController;
angular.module('portainer.kubernetes').controller('KubernetesConfigsController', KubernetesConfigsController);
