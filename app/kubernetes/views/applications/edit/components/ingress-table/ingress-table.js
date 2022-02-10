import angular from 'angular';
import controller from './ingress-table.controller';

angular.module('portainer.kubernetes').component('kubernetesApplicationIngressTable', {
  templateUrl: './ingress-table.html',
  controller,
  bindings: {
    application: '<',
    publicUrl: '<',
  },
});
