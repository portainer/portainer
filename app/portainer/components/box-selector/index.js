import angular from 'angular';

import controller from './box-selector.controller';

angular.module('portainer.app').component('boxSelector', {
  templateUrl: './box-selector.html',
  controller,
  bindings: {
    radioName: '@',
    ngModel: '=',
    options: '<',
    onChange: '<',
  },
});
