angular.module('portainer.app').component('stackDuplicationForm', {
  templateUrl: './stack-duplication-form.html',
  controller: 'StackDuplicationFormController',
  bindings: {
    onDuplicate: '&',
    onMigrate: '&',
    endpoints: '<',
    groups: '<',
    currentEndpointId: '<',
    yamlError: '<',
  },
});
