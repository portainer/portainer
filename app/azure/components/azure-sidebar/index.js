import angular from 'angular';

angular.module('portainer.azure').component('azureSidebar', {
  templateUrl: './azure-sidebar.html',
  bindings: {
    endpointId: '<',
  },
});
