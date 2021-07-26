import angular from 'angular';
import controller from './help-and-support.controller';

export const helpAndSupport = {
  templateUrl: './help-and-support.html',
  controller,
  bindings: {
    $transition$: '<',
  },
};

angular.module('portainer.app').component('helpAndSupportView', helpAndSupport);
