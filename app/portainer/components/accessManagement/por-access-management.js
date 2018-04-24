angular.module('portainer.app').component('porAccessManagement', {
  templateUrl: 'app/portainer/components/accessManagement/porAccessManagement.html',
  controller: 'porAccessManagementController',
  bindings: {
    accessControlledEntity: '<',
    inheritFrom: '<',
    updateAccess: '&'
  }
});
