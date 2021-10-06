import angular from 'angular';

export const porSwitchField = {
  templateUrl: './por-switch-field.html',
  bindings: {
    tooltip: '@',
    ngModel: '=',
    label: '@',
    name: '@',
    labelClass: '@',
    ngDataCy: '@',
    disabled: '<',
    onChange: '<',
    feature: '<', // feature id
  },
};

angular.module('portainer.app').component('porSwitchField', porSwitchField);
