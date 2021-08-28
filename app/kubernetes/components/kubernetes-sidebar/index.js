import angular from 'angular';

angular.module('portainer.kubernetes').component('kubernetesSidebar', {
  templateUrl: './kubernetes-sidebar.html',
  bindings: {
    endpointId: '<',
    isSidebarOpen: '<',
    adminAccess: '<',
  },
});
