import angular from 'angular';

angular.module('portainer.app').component('endpointSelector', {
  templateUrl: './endpointSelector.html',
  controller: 'EndpointSelectorController',
  bindings: {
    'model': '=',
    'endpoints': '<',
    'groups': '<'
  }
});
