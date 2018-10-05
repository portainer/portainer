angular.module('portainer.app').component('stackDuplicationForm', {
  templateUrl:
    'app/portainer/components/stack-duplication-form/stack-duplication-form.html',
  controller: 'StackDuplicationFormController',
  bindings: {
    onDuplicate: '&',
    onMigrate: '&',
    endpoints: '<',
    groups: '<',
    currentEndpointId: '<',
    applicationState: '<'
  }
});
