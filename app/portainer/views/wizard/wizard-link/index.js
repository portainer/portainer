import angular from 'angular';
import './wizard-link.css';

angular.module('portainer.app').component('wizardLink', {
  templateUrl: './wizard-link.html',
  bindings: {
    linkTitle: '@',
    description: '@',
    icon: '<',
  },
});
