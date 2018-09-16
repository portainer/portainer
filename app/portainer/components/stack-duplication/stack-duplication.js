angular.module('portainer.app').component('stackDuplication', {
  templateUrl:
    'app/portainer/components/stack-duplication/stack-duplication.html',
  controller: 'StackDuplicationController',
  bindings: {
    stack: '<',
    onDuplicate: '&',
    endpoints: '<',
    groups: '<'
  }
});
