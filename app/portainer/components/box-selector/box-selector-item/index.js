import angular from 'angular';

import './box-selector-item.css';

import controller from './box-selector-item.controller';

angular.module('portainer.app').component('boxSelectorItem', {
  templateUrl: './box-selector-item.html',
  controller,
  require: {
    formCtrl: '^^form',
  },
  bindings: {
    radioName: '@',
    isChecked: '<',
    option: '<',
    onChange: '<',
    disabled: '<',
    tooltip: '<',
  },
});
