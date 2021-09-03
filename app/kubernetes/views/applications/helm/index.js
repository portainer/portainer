import angular from 'angular';
import controller from './helm.controller';
import './helm.css';

angular.module('portainer.kubernetes').component('kubernetesHelmApplicationView', {
  templateUrl: './helm.html',
  controller,
  bindings: {
    endpoint: '<',
  },
});
