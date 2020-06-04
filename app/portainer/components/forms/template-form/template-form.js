angular.module('portainer.app').component('templateForm', {
  templateUrl: './templateForm.html',
  controller: 'TemplateFormController',
  bindings: {
    model: '=',
    categories: '<',
    networks: '<',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
    showTypeSelector: '<',
  },
});
