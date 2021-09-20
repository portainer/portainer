import angular from 'angular';
import controller from './wizard-aci.controller.js';

angular.module('portainer.app').component('wizardAci', {
  templateUrl: './wizard-aci.html',
  controller,
  bindings: {
    onUpdate: '<',
    onAnalytics: '<',
  },
});
