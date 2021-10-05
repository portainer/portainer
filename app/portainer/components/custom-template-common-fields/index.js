import CustomTemplateCommonFieldsController from './customTemplateCommonFieldsController.js';

angular.module('portainer.app').component('customTemplateCommonFields', {
  templateUrl: './customTemplateCommonFields.html',
  controller: CustomTemplateCommonFieldsController,
  bindings: {
    formValues: '=',
    showPlatformField: '<',
    showTypeField: '<',
    nameRegex: '<',
  },
});
