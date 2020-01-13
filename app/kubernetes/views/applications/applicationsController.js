import angular from 'angular';

class KubernetesApplicationsController {
  /* @ngInject */
  constructor($async, Notifications) {
    this.$async = $async;
    this.Notifications = Notifications;
  }

  $onInit() {
    this.applications = [];
  }
}

export default KubernetesApplicationsController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationsController', KubernetesApplicationsController);