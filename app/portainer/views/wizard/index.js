import angular from 'angular';
import controller from './wizard-view.controller.js';

angular.module('portainer.app').component('wizardView', {
  templateUrl: './wizard-view.html',
  controller,
});
