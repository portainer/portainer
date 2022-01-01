import angular from 'angular';
import controller from './wizard-kubernetes.controller.js';

angular.module('portainer.app').component('wizardKubernetes', {
  templateUrl: './wizard-kubernetes.html',
  controller,
  bindings: {
    onUpdate: '<',
    onAnalytics: '<',
  },
});
