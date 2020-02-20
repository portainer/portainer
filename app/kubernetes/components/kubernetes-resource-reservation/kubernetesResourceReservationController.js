import angular from 'angular';

class KubernetesResourceReservationController {
  /* @ngInject */
  constructor($scope) {
    this.$scope = $scope;

    this.usageLevelInfo = this.usageLevelInfo.bind(this);
    this.usageValues = this.usageValues.bind(this);
  }

  usageLevelInfo(usage) {
    if (usage >= 80) {
      return 'danger';
    } else if (usage > 50 && usage < 80) {
      return 'warning';
    } else {
      return 'success';
    }
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