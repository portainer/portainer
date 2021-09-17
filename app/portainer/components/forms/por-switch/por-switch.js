import angular from 'angular';
import controller from './por-switch.controller';

import './por-switch.css';

const porSwitch = {
  templateUrl: './por-switch.html',
  controller,
  bindings: {
    ngModel: '=',
    id: '@',
    className: '@',
    name: '@',
    ngDataCy: '@',
    disabled: '<',
    onChange: '<',
    feature: '<', // feature id
  },
};

angular.module('portainer.app').component('porSwitch', porSwitch);
