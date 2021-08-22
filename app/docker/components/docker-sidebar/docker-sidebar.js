angular.module('portainer.docker').component('dockerSidebar', {
  templateUrl: './docker-sidebar.html',
  bindings: {
    isSidebarOpen: '<',

    endpointApiVersion: '<',
    swarmManagement: '<',
    standaloneManagement: '<',
    adminAccess: '<',
    offlineMode: '<',
    currentRouteName: '<',
    endpointId: '<',
    showStacks: '<',
  },
});
