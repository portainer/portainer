import angular from 'angular';

const porSwitch = {
  templateUrl: './por-switch.html',
  bindings: {
    tooltip: '@',
    ngModel: '=',
    label: '@',
    name: '@',
    disabled: '<',
    onChange: '<',
  },
};

angular.module('portainer.app').component('porSwitch', porSwitch);
