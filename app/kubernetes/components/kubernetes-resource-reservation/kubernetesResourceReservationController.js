import angular from 'angular';

class KubernetesResourceReservationController {
  /* @ngInject */
  constructor($scope) {
    this.$scope = $scope;
  }

  usageValues() {
    if (this.cpuLimit) {
      this.cpuUsage = Math.round(this.cpu / this.cpuLimit * 100);
    }
    if (this.memoryLimit) {
      this.memoryUsage = Math.round(this.memory / this.memoryLimit * 100);
    }
  }

  $onInit() {
    this.usageValues();
  }
}

export default KubernetesResourceReservationController;
angular.module('portainer.kubernetes').controller('KubernetesResourceReservationController', KubernetesResourceReservationController);