import angular from 'angular';

angular.module('portainer.app').component('stackFromTemplateForm', {
  templateUrl: './stackFromTemplateForm.html',
  bindings: {
    template: '=',
    formValues: '=',
    state: '=',
    createTemplate: '<',
    unselectTemplate: '<',
    nameRegex: '<',
  },
  transclude: {
    advanced: '?advancedForm',
  },
});
