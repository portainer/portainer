angular.module('portainer.docker').component('nodeAvailabilitySelect', {
  templateUrl: './node-availability-select.html',
  controller: 'NodeAvailabilitySelectController',
  bindings: {
    availability: '<',
    originalValue: '<',
    onSave: '&',
  },
});
