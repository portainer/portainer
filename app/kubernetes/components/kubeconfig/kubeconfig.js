import angular from 'angular';
import controller from './kubeconfig.controller';

angular.module('portainer.kubernetes').component('kubeConfig', {
  templateUrl: './kubeconfig.html',
  controller,
});
