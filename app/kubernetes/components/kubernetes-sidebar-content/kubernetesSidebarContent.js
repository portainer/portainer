angular.module('portainer.kubernetes').component('kubernetesSidebarContent', {
  templateUrl: './kubernetesSidebarContent.html',
  bindings: {
    adminAccess: '<',
    endpointId: '<',
    currentState: '<',
  },
});
