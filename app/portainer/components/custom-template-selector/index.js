import angular from 'angular';
import controller from './custom-template-selector.controller.js';

export const customTemplateSelector = {
  templateUrl: './custom-template-selector.html',
  controller,
  bindings: {
    newTemplatePath: '@',
    stackType: '<',

    value: '<',
    onChange: '<',
  },
};

angular.module('portainer.app').component('customTemplateSelector', customTemplateSelector);
