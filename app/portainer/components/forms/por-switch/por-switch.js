import angular from 'angular';

const porSwitch = {
  templateUrl: './por-switch.html',
  bindings: {
    ngModel: '=',
    id: '@',
    className: '@',
    name: '@',
    disabled: '<',
    onChange: '<',
    datacy: '@',
  },
};

angular.module('portainer.app').component('porSwitch', porSwitch);
