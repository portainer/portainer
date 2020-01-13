import angular from 'angular';

class KubernetesStacksController {
  /* @ngInject */
  constructor($async, Notifications) {
    this.$async = $async;
    this.Notifications = Notifications;
  }

  $onInit() {
    this.stacks = [];
  }
}

export default KubernetesStacksController;
angular.module('portainer.kubernetes').controller('KubernetesStacksController', KubernetesStacksController);