import angular from 'angular';
import controller from './wizard-docker.controller.js';

angular.module('portainer.app').component('wizardDocker', {
  templateUrl: './wizard-docker.html',
  controller,
  bindings: {
    onUpdate: '<',
    onAnalytics: '<',
  },
});
