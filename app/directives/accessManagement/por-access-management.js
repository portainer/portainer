angular.module('portainer').component('porAccessManagement', {
  templateUrl: 'app/directives/accessManagement/porAccessManagement.html',
  controller: 'porAccessManagementController',
  bindings: {
    accessControlledEntity: '<',
    updateAccess: '&'
  }
});
