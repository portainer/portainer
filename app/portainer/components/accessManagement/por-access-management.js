export const porAccessManagement = {
  templateUrl: './porAccessManagement.html',
  controller: 'porAccessManagementController',
  controllerAs: 'ctrl',
  bindings: {
    endpoint: '<',
    accessControlledEntity: '<',
    inheritFrom: '<',
    entityType: '@',
    updateAccess: '<',
    actionInProgress: '<',
  },
};
