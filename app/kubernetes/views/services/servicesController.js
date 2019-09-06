import angular from 'angular';

class KubernetesServicesController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesServiceService, KubernetesDeploymentService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.KubernetesServiceService = KubernetesServiceService;
    this.KubernetesDeploymentService = KubernetesDeploymentService;

    this.getAll = this.getAll.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
  }

  async getAllAsync() {
    try {
      const [services, deployments] = await Promise.all([
        this.KubernetesServiceService.services(),
        this.KubernetesDeploymentService.deployments()
      ]);
      this.services = services;
      this.deployments = deployments;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve services and deployments');
    }
  }

  getAll() {
    return this.$async(this.getAllAsync);
  }

  async $onInit() {
    this.getAll();
  }
}

export default KubernetesServicesController;
angular.module('portainer.kubernetes').controller('KubernetesServicesController', KubernetesServicesController);