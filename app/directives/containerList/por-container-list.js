angular.module('portainer').component('porContainerList', {
  templateUrl: 'app/directives/containerList/porContainerList.html',
  controller: 'porContainerListController',
  bindings: {
    'containers': '<'
  }
});
