import angular from 'angular';
import controller from './kube-config.controller';

angular.module('portainer.kubernetes').component('kubeConfig', {
  templateUrl: './kube-config.html',
  controller,
});
