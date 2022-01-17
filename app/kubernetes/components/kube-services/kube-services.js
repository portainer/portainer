import angular from 'angular';
import controller from './kube-services.controller';

angular.module('portainer.kubernetes').component('kubeServicesView', {
  templateUrl: './kube-services.html',
  controller,
  bindings: {
    formValues: '=',
    isEdit: '<',
    loadbalancerEnabled: '<',
  },
});
