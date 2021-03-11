angular.module('portainer.app').component('endpointRegistriesView', {
  templateUrl: './registries.html',
  controller: 'EndpointRegistriesController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
  },
});
