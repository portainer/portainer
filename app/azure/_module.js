angular.module('portainer.azure', ['portainer.app'])
.config(['$stateRegistryProvider', function ($stateRegistryProvider) {
  'use strict';

  var azure = {
    name: 'azure',
    parent: 'root',
    abstract: true
  };

  var dashboard = {
    name: 'azure.dashboard',
    url: '/dashboard',
    views: {
      'content@': {
        templateUrl: 'app/azure/views/dashboard/dashboard.html',
        controller: 'AzureDashboardController'
      }
    }
  };

  $stateRegistryProvider.register(azure);
  $stateRegistryProvider.register(dashboard);
}]);
