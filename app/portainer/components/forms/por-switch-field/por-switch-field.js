import angular from 'angular';

const porSwitchField = {
  templateUrl: './por-switch-field.html',
  bindings: {
    tooltip: '@',
    ngModel: '=',
    label: '@',
    name: '@',
    labelClass: '@',
    disabled: '<',
    onChange: '<',
  },
};

angular.module('portainer.app').component('porSwitchField', porSwitchField);
