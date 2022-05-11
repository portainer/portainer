import angular from 'angular';
import controller from './registryController';

angular.module('portainer.app').component('editRegistry', {
  templateUrl: './registry.html',
  controller,
  bindings: {
    $transition$: '<',
  },
});
