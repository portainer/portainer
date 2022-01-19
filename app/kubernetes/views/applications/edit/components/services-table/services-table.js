import angular from 'angular';

angular.module('portainer.kubernetes').component('kubernetesApplicationServicesTable', {
  templateUrl: './services-table.html',
  bindings: {
    services: '<',
    application: '<',
    publicUrl: '<',
  },
});
