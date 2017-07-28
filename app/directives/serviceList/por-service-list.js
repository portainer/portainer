angular.module('portainer').component('porServiceList', {
  templateUrl: 'app/directives/serviceList/porServiceList.html',
  controller: 'porServiceListController',
  bindings: {
    'services': '<',
    'nodes': '<'
  }
});
