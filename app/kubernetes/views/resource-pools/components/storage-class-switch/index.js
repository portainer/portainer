import angular from 'angular';
import controller from './storage-class-switch.controller.js';

export const storageClassSwitch = {
  templateUrl: './storage-class-switch.html',
  controller,
  bindings: {
    value: '<',
    onChange: '<',
    name: '<',
  },
};

angular.module('portainer.kubernetes').component('storageClassSwitch', storageClassSwitch);
