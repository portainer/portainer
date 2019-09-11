import angular from 'angular';

class KubernetesServicesController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesServiceService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.KubernetesServiceService = KubernetesServiceService;

    this.getServices = this.getServices.bind(this);
    this.getServicesAsync = this.getServicesAsync.bind(this);
  }

  async getServicesAsync() {
    try {
      this.services = await this.KubernetesServiceService.services();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve services and deployments');
    }
  }

  getServices() {
    return this.$async(this.getServicesAsync);
  }

  async $onInit() {
    this.getServices();
  }
}

export default KubernetesServicesController;
angular.module('portainer.kubernetes').controller('KubernetesServicesController', KubernetesServicesController);