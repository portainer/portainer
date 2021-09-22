import angular from 'angular';
import controller from './copy-button.controller';
import './copy-button.css';

angular.module('portainer.app').component('copyButton', {
  templateUrl: './copy-button.html',
  controller,
  bindings: {
    value: '<',
  },
});
