import angular from 'angular';

angular.module('portainer.app').component('porAccessManagement', {
  templateUrl: './porAccessManagement.html',
  controller: 'porAccessManagementController',
  bindings: {
    accessControlledEntity: '<',
    inheritFrom: '<',
    entityType: '@',
    updateAccess: '&'
  }
});
