angular.module('portainer.app').component('porAccessManagement', {
  templateUrl: './porAccessManagement.html',
  controller: 'porAccessManagementController',
  controllerAs: 'ctrl',
  bindings: {
    accessControlledEntity: '<',
    inheritFrom: '<',
    entityType: '@',
    updateAccess: '<',
    actionInProgress: '<'
  }
});
