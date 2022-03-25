import angular from 'angular';

import controller from './adminTimeoutController';

angular.module('portainer.app').component('adminTimeoutView', {
  templateUrl: './adminTimeout.html',
  controller,
});
