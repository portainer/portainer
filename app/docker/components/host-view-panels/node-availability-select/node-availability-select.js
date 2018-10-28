import angular from 'angular';

angular.module('portainer.docker').component('nodeAvailabilitySelect', {
  templateUrl:
    'app/docker/components/host-view-panels/node-availability-select/node-availability-select.html',
  controller: 'NodeAvailabilitySelectController',
  bindings: {
    availability: '<',
    originalValue: '<',
    onSave: '&'
  }
});
