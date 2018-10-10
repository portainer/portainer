import angular from 'angular';
import authenticationTemplate from "./views/auth/auth.html";
import sidebarTemplate from './views/sidebar/sidebar.html';
import aboutTemplate from './views/about/about.html';
import accountTemplate from './views/account/account.html';
import endpointsTemplate from './views/endpoints/endpoints.html';
import endpointTemplate from './views/endpoints/edit/endpoint.html';
import createendpointTemplate from './views/endpoints/create/createendpoint.html';
import endpointAccessTemplate from './views/endpoints/access/endpointAccess.html';
import groupsTemplate from './views/groups/groups.html';
import groupTemplate from './views/groups/edit/group.html';
import creategroupTemplate from './views/groups/create/creategroup.html';
import groupAccessTemplate from './views/groups/access/groupAccess.html';
import homeTemplate from './views/home/home.html';
import initEndpointTemplate from './views/init/endpoint/initEndpoint.html';
import initAdminTemplate from './views/init/admin/initAdmin.html';
import registriesTemplate from './views/registries/registries.html';
import registryTemplate from './views/registries/edit/registry.html';
import createregistryTemplate from './views/registries/create/createregistry.html';
import registryAccessTemplate from './views/registries/access/registryAccess.html';
import settingsTemplate from './views/settings/settings.html';
import settingsAuthenticationTemplate from './views/settings/authentication/settingsAuthentication.html';
import stacksTemplate from './views/stacks/stacks.html';
import stackTemplate from './views/stacks/edit/stack.html';
import createstackTemplate from './views/stacks/create/createstack.html';
import supportTemplate from './views/support/support.html';
import tagsTemplate from './views/tags/tags.html';
import updatePasswordTemplate from './views/update-password/updatePassword.html';
import usersTemplate from './views/users/users.html';
import userTemplate from './views/users/edit/user.html';
import teamsTemplate from './views/teams/teams.html';
import teamTemplate from './views/teams/edit/team.html';
import templatesTemplate from './views/templates/templates.html';
import templateTemplate from './views/templates/edit/template.html';
import createtemplateTemplate from './views/templates/create/createtemplate.html';

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
        templateUrl: sidebarTemplate,
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
        templateUrl: aboutTemplate,
      }
    }
  };

  var account = {
    name: 'portainer.account',
    url: '/account',
    views: {
      'content@': {
        templateUrl: accountTemplate,
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
        templateUrl: authenticationTemplate,
        controller: 'AuthenticationController'
      },
      'sidebar@': {}
    },
    data: {
      requiresLogin: false
    }
  };

  var endpoints = {
    name: 'portainer.endpoints',
    url: '/endpoints',
    views: {
      'content@': {
        templateUrl: endpointsTemplate,
        controller: 'EndpointsController'
      }
    }
  };

  var endpoint = {
    name: 'portainer.endpoints.endpoint',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: endpointTemplate,
        controller: 'EndpointController'
      }
    }
  };

  var endpointCreation  = {
    name: 'portainer.endpoints.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: createendpointTemplate,
        controller: 'CreateEndpointController'
      }
    }
  };

  var endpointAccess = {
    name: 'portainer.endpoints.endpoint.access',
    url: '/access',
    views: {
      'content@': {
        templateUrl: endpointAccessTemplate,
        controller: 'EndpointAccessController'
      }
    }
  };

  var groups = {
    name: 'portainer.groups',
    url: '/groups',
    views: {
      'content@': {
        templateUrl: groupsTemplate,
        controller: 'GroupsController'
      }
    }
  };

  var group = {
    name: 'portainer.groups.group',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: groupTemplate,
        controller: 'GroupController'
      }
    }
  };

  var groupCreation = {
    name: 'portainer.groups.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: creategroupTemplate,
        controller: 'CreateGroupController'
      }
    }
  };

  var groupAccess = {
    name: 'portainer.groups.group.access',
    url: '/access',
    views: {
      'content@': {
        templateUrl: groupAccessTemplate,
        controller: 'GroupAccessController'
      }
    }
  };

  var home = {
    name: 'portainer.home',
    url: '/home',
    views: {
      'content@': {
        templateUrl: homeTemplate,
        controller: 'HomeController'
      }
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
        templateUrl: initEndpointTemplate,
        controller: 'InitEndpointController'
      }
    }
  };

  var initAdmin = {
    name: 'portainer.init.admin',
    url: '/admin',
    views: {
      'content@': {
        templateUrl: initAdminTemplate,
        controller: 'InitAdminController'
      }
    }
  };

  var registries = {
    name: 'portainer.registries',
    url: '/registries',
    views: {
      'content@': {
        templateUrl: registriesTemplate,
        controller: 'RegistriesController'
      }
    }
  };

  var registry = {
    name: 'portainer.registries.registry',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: registryTemplate,
        controller: 'RegistryController'
      }
    }
  };

  var registryCreation  = {
    name: 'portainer.registries.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: createregistryTemplate,
        controller: 'CreateRegistryController'
      }
    }
  };

  var registryAccess = {
    name: 'portainer.registries.registry.access',
    url: '/access',
    views: {
      'content@': {
        templateUrl: registryAccessTemplate,
        controller: 'RegistryAccessController'
      }
    }
  };

  var settings = {
    name: 'portainer.settings',
    url: '/settings',
    views: {
      'content@': {
        templateUrl: settingsTemplate,
        controller: 'SettingsController'
      }
    }
  };

  var settingsAuthentication = {
    name: 'portainer.settings.authentication',
    url: '/auth',
    views: {
      'content@': {
        templateUrl: settingsAuthenticationTemplate,
        controller: 'SettingsAuthenticationController'
      }
    }
  };

  var stacks = {
    name: 'portainer.stacks',
    url: '/stacks',
    views: {
      'content@': {
        templateUrl: stacksTemplate,
        controller: 'StacksController'
      }
    }
  };

  var stack = {
    name: 'portainer.stacks.stack',
    url: '/:name?id&type&external',
    views: {
      'content@': {
        templateUrl: stackTemplate,
        controller: 'StackController'
      }
    }
  };

  var stackCreation = {
    name: 'portainer.newstack',
    url: '/newstack',
    views: {
      'content@': {
        templateUrl: createstackTemplate,
        controller: 'CreateStackController'
      }
    }
  };

  var support = {
    name: 'portainer.support',
    url: '/support',
    views: {
      'content@': {
        templateUrl: supportTemplate,
      }
    }
  };

  var tags = {
    name: 'portainer.tags',
    url: '/tags',
    views: {
      'content@': {
        templateUrl: tagsTemplate,
        controller: 'TagsController'
      }
    }
  };

  var updatePassword = {
    name: 'portainer.updatePassword',
    url: '/update-password',
    views: {
      'content@': {
        templateUrl: updatePasswordTemplate,
        controller: 'UpdatePasswordController'
      },
      'sidebar@': {}
    }
  };

  var users = {
    name: 'portainer.users',
    url: '/users',
    views: {
      'content@': {
        templateUrl: usersTemplate,
        controller: 'UsersController'
      }
    }
  };

  var user = {
    name: 'portainer.users.user',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: userTemplate,
        controller: 'UserController'
      }
    }
  };

  var teams = {
    name: 'portainer.teams',
    url: '/teams',
    views: {
      'content@': {
        templateUrl: teamsTemplate,
        controller: 'TeamsController'
      }
    }
  };

  var team = {
    name: 'portainer.teams.team',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: teamTemplate,
        controller: 'TeamController'
      }
    }
  };

  var templates = {
    name: 'portainer.templates',
    url: '/templates',
    views: {
      'content@': {
        templateUrl: templatesTemplate,
        controller: 'TemplatesController'
      }
    }
  };

  var template = {
    name: 'portainer.templates.template',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: templateTemplate,
        controller: 'TemplateController'
      }
    }
  };

  var templateCreation = {
    name: 'portainer.templates.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: createtemplateTemplate,
        controller: 'CreateTemplateController'
      }
    }
  };

  $stateRegistryProvider.register(root);
  $stateRegistryProvider.register(portainer);
  $stateRegistryProvider.register(about);
  $stateRegistryProvider.register(account);
  $stateRegistryProvider.register(authentication);
  $stateRegistryProvider.register(endpoints);
  $stateRegistryProvider.register(endpoint);
  $stateRegistryProvider.register(endpointAccess);
  $stateRegistryProvider.register(endpointCreation);
  $stateRegistryProvider.register(groups);
  $stateRegistryProvider.register(group);
  $stateRegistryProvider.register(groupAccess);
  $stateRegistryProvider.register(groupCreation);
  $stateRegistryProvider.register(home);
  $stateRegistryProvider.register(init);
  $stateRegistryProvider.register(initEndpoint);
  $stateRegistryProvider.register(initAdmin);
  $stateRegistryProvider.register(registries);
  $stateRegistryProvider.register(registry);
  $stateRegistryProvider.register(registryAccess);
  $stateRegistryProvider.register(registryCreation);
  $stateRegistryProvider.register(settings);
  $stateRegistryProvider.register(settingsAuthentication);
  $stateRegistryProvider.register(stacks);
  $stateRegistryProvider.register(stack);
  $stateRegistryProvider.register(stackCreation);
  $stateRegistryProvider.register(support);
  $stateRegistryProvider.register(tags);
  $stateRegistryProvider.register(updatePassword);
  $stateRegistryProvider.register(users);
  $stateRegistryProvider.register(user);
  $stateRegistryProvider.register(teams);
  $stateRegistryProvider.register(team);
  $stateRegistryProvider.register(templates);
  $stateRegistryProvider.register(template);
  $stateRegistryProvider.register(templateCreation);
}]);
