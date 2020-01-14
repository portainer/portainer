import angular from 'angular';
import { KubernetesApplicationDeploymentTypes } from 'Kubernetes/models/application';
class KubernetesApplicationsController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesApplicationService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.getApplications = this.getApplications.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
  }

  async getApplicationsAsync() {
    try {
      this.applications = await this.KubernetesApplicationService.applications();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications');
    }
  }

  getApplications() {
    return this.$async(this.getApplicationsAsync);
  }

  async onInit() {
    this.KubernetesApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
    this.getApplications();
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesApplicationsController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationsController', KubernetesApplicationsController);