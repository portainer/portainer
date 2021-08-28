import angular from 'angular';
import KubernetesCreateResourcePoolController from './createResourcePoolController';

angular.module('portainer.kubernetes').component('kubernetesCreateResourcePoolView', {
  templateUrl: './createResourcePool.html',
  controller: KubernetesCreateResourcePoolController,
  bindings: {
    endpoint: '<',
  },
});
