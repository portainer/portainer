import angular from 'angular';

angular.module('portainer.docker').component('devicesPanel', {
  templateUrl:
    'app/docker/components/host-view-panels/devices-panel/devices-panel.html',
  bindings: {
    devices: '<'
  }
});
