import angular from 'angular';
import './sensitive-details.css';

angular.module('portainer.app').component('sensitiveDetails', {
  templateUrl: './sensitive-details.html',
  bindings: {
    key: '@',
    value: '@',
  },
});
