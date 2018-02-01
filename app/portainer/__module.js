angular.module('portainer.app', [])
.config(['$stateRegistryProvider', function ($stateRegistryProvider) {
  'use strict';

  var root = {
    name: 'root',
    abstract: true,
    resolve: {
      requiresLogin: ['StateManager', function (StateManager) {
        var applicationState = StateManager.getState();
        return applicationState.application.authentication;
      }]
    },
    views: {
      'sidebar@': {
        templateUrl: 'app/portainer/views/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  };

  var portainer = {
    name: 'portainer',
    parent: 'root',
    abstract: true
  };

  var about = {
    name: 'portainer.about',
    url: '/about',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/about/about.html'
      }
    }
  };

  var account = {
    name: 'portainer.account',
    url: '/account',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/account/account.html',
        controller: 'AccountController'
      }
    }
  };

  var authentication = {
    name: 'portainer.auth',
    url: '/auth',
    params: {
      logout: false,
      error: ''
    },
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/auth/auth.html',
        controller: 'AuthenticationController'
      },
      'sidebar@': {}
    },
    data: {
      requiresLogin: false
    }
  };

  var init = {
    name: 'portainer.init',
    abstract: true,
    url: '/init',
    data: {
      requiresLogin: false
    },
    views: {
      'sidebar@': {}
    }
  };

  var initEndpoint = {
    name: 'portainer.init.endpoint',
    url: '/endpoint',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/init/endpoint/initEndpoint.html',
        controller: 'InitEndpointController'
      }
    }
  };

  var initAdmin = {
    name: 'portainer.init.admin',
    url: '/admin',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/init/admin/initAdmin.html',
        controller: 'InitAdminController'
      }
    }
  };

  var endpoints = {
    name: 'portainer.endpoints',
    url: '/endpoints',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/endpoints/endpoints.html',
        controller: 'EndpointsController'
      }
    }
  };

  var endpoint = {
    name: 'portainer.endpoints.endpoint',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/endpoints/edit/endpoint.html',
        controller: 'EndpointController'
      }
    }
  };

  var endpointAccess = {
    name: 'portainer.endpoints.endpoint.access',
    url: '/access',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/endpoints/access/endpointAccess.html',
        controller: 'EndpointAccessController'
      }
    }
  };

  var registries = {
    name: 'portainer.registries',
    url: '/registries',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/registries/registries.html',
        controller: 'RegistriesController'
      }
    }
  };

  var registry = {
    name: 'portainer.registries.registry',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/registries/edit/registry.html',
        controller: 'RegistryController'
      }
    }
  };

  var registryCreation  = {
    name: 'portainer.registries.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/registries/create/createregistry.html',
        controller: 'CreateRegistryController'
      }
    }
  };

  var registryAccess = {
    name: 'portainer.registries.registry.access',
    url: '/access',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/registries/access/registryAccess.html',
        controller: 'RegistryAccessController'
      }
    }
  };

  var settings = {
    name: 'portainer.settings',
    url: '/settings',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/settings/settings.html',
        controller: 'SettingsController'
      }
    }
  };

  var settingsAuthentication = {
    name: 'portainer.settings.authentication',
    url: '/auth',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/settings/authentication/settingsAuthentication.html',
        controller: 'SettingsAuthenticationController'
      }
    }
  };

  var users = {
    name: 'portainer.users',
    url: '/users',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/users/users.html',
        controller: 'UsersController'
      }
    }
  };

  var user = {
    name: 'portainer.users.user',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/users/edit/user.html',
        controller: 'UserController'
      }
    }
  };

  var teams = {
    name: 'portainer.teams',
    url: '/teams',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/teams/teams.html',
        controller: 'TeamsController'
      }
    }
  };

  var team = {
    name: 'portainer.teams.team',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/portainer/views/teams/edit/team.html',
        controller: 'TeamController'
      }
    }
  };

  $stateRegistryProvider.register(root);
  $stateRegistryProvider.register(portainer);
  $stateRegistryProvider.register(about);
  $stateRegistryProvider.register(account);
  $stateRegistryProvider.register(authentication);
  $stateRegistryProvider.register(init);
  $stateRegistryProvider.register(initEndpoint);
  $stateRegistryProvider.register(initAdmin);
  $stateRegistryProvider.register(endpoints);
  $stateRegistryProvider.register(endpoint);
  $stateRegistryProvider.register(endpointAccess);
  $stateRegistryProvider.register(registries);
  $stateRegistryProvider.register(registry);
  $stateRegistryProvider.register(registryAccess);
  $stateRegistryProvider.register(registryCreation);
  $stateRegistryProvider.register(settings);
  $stateRegistryProvider.register(settingsAuthentication);
  $stateRegistryProvider.register(users);
  $stateRegistryProvider.register(user);
  $stateRegistryProvider.register(teams);
  $stateRegistryProvider.register(team);
}]);
