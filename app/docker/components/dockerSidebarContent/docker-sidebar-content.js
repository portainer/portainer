angular.module('portainer.docker').component('dockerSidebarContent', {
  templateUrl: './dockerSidebarContent.html',
  bindings: {
    endpointApiVersion: '<',
    swarmManagement: '<',
    standaloneManagement: '<',
    adminAccess: '<',
    offlineMode: '<',
    toggle: '<',
    currentRouteName: '<',
  },
});
