import angular from 'angular';

angular.module('portainer.docker').component('dockerSidebarContent', {
  templateUrl: './dockerSidebarContent.html',
  bindings: {
    endpointApiVersion: '<',
    swarmManagement: '<',
    standaloneManagement: '<',
    adminAccess: '<'
  }
});
