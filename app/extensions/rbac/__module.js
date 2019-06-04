angular.module('portainer.extensions.rbac', ['ngResource'])
  .constant('API_ENDPOINT_ROLES', 'api/roles')
  .config(['$stateRegistryProvider', function ($stateRegistryProvider) {
    'use strict';

    var roles = {
      name: 'portainer.roles',
      url: '/roles',
      views: {
        'content@': {
          templateUrl: './views/roles/roles.html',
          controller: 'RolesController',
          controllerAs: 'ctrl'
        }
      }
    };

    $stateRegistryProvider.register(roles);
  }]);
