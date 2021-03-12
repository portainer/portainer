angular.module('portainer.app').component('endpointRegistryView', {
  templateUrl: './registry.html',
  controller: 'EndpointRegistryController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
  },
});
