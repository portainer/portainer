import angular from 'angular';

angular.module('portainer.app').component('wizardEndpointType', {
  templateUrl: './wizard-endpoint-type.html',
  bindings: {
    endpointTitle: '@',
    description: '@',
    icon: '@',
    active: '<',
  },
});
