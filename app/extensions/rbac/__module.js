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

    var role = {
      name: 'portainer.roles.role',
      url: '/:id',
      views: {
        'content@': {
          templateUrl: './views/roles/edit/role.html',
          controller: 'RoleController',
          controllerAs: 'ctrl'
        }
      }
    };

    var roleCreation = {
      name: 'portainer.roles.new',
      url: '/new',
      views: {
        'content@': {
          templateUrl: './views/roles/create/createrole.html',
          controller: 'CreateRoleController',
          controllerAs: 'ctrl'
        }
      }
    };

    $stateRegistryProvider.register(roles);
    $stateRegistryProvider.register(role);
    $stateRegistryProvider.register(roleCreation);
  }]);
