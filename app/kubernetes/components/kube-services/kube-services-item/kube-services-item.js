import angular from 'angular';
import controller from './kube-services-item.controller';

angular.module('portainer.kubernetes').component('kubeServicesItemView', {
  templateUrl: './kube-services-item.html',
  controller,
  bindings: {
    nodePortServices: '<',
    formServices: '<',
    service: '=',
    isEdit: '<',
    loadbalancerEnabled: '<',
  },
});
