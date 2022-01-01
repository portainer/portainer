import angular from 'angular';
import controller from './wizard-endpoints.controller.js';
import './wizard-endpoints.css';

angular.module('portainer.app').component('wizardEndpoints', {
  templateUrl: './wizard-endpoints.html',
  controller,
});
