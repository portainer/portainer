function configureRoutes($stateProvider) {
  $stateProvider
  .state('root', {
    abstract: true,
    resolve: {
      requiresLogin: ['StateManager', function (StateManager) {
        var applicationState = StateManager.getState();
        return applicationState.application.authentication;
      }]
    }
  })
  .state('auth', {
    parent: 'root',
    url: '/auth',
    params: {
      logout: false,
      error: ''
    },
    views: {
      'content@': {
        templateUrl: 'app/components/auth/auth.html',
        controller: 'AuthenticationController'
      }
    },
    data: {
      requiresLogin: false
    }
  })
  .state('containers', {
    parent: 'root',
    url: '/containers/',
    views: {
      'content@': {
        templateUrl: 'app/components/containers/containers.html',
        controller: 'ContainersController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('container', {
    url: '^/containers/:id',
    views: {
      'content@': {
        templateUrl: 'app/components/container/container.html',
        controller: 'ContainerController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('stats', {
    url: '^/containers/:id/stats',
    views: {
      'content@': {
        templateUrl: 'app/components/containerStats/containerStats.html',
        controller: 'ContainerStatsController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('containerlogs', {
    url: '^/containers/:id/logs',
    views: {
      'content@': {
        templateUrl: 'app/components/containerLogs/containerlogs.html',
        controller: 'ContainerLogsController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('servicelogs', {
    url: '^/services/:id/logs',
    views: {
      'content@': {
        templateUrl: 'app/components/serviceLogs/servicelogs.html',
        controller: 'ServiceLogsController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('console', {
    url: '^/containers/:id/console',
    views: {
      'content@': {
        templateUrl: 'app/components/containerConsole/containerConsole.html',
        controller: 'ContainerConsoleController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('inspect', {
    url: '^/containers/:id/inspect',
    views: {
      'content@': {
        templateUrl: 'app/components/containerInspect/containerInspect.html',
        controller: 'ContainerInspectController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('dashboard', {
    parent: 'root',
    url: '/dashboard',
    views: {
      'content@': {
        templateUrl: 'app/components/dashboard/dashboard.html',
        controller: 'DashboardController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('actions', {
    abstract: true,
    url: '/actions',
    views: {
      'content@': {
        template: '<div ui-view="content@"></div>'
      },
      'sidebar@': {
        template: '<div ui-view="sidebar@"></div>'
      }
    }
  })
  .state('actions.create', {
    abstract: true,
    url: '/create',
    views: {
      'content@': {
        template: '<div ui-view="content@"></div>'
      },
      'sidebar@': {
        template: '<div ui-view="sidebar@"></div>'
      }
    }
  })
  .state('actions.create.container', {
    url: '/container/:from',
    views: {
      'content@': {
        templateUrl: 'app/components/createContainer/createcontainer.html',
        controller: 'CreateContainerController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    },
    params: {
      from: ''
    }
  })
  .state('actions.create.network', {
    url: '/network',
    views: {
      'content@': {
        templateUrl: 'app/components/createNetwork/createnetwork.html',
        controller: 'CreateNetworkController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('actions.create.registry', {
    url: '/registry',
    views: {
      'content@': {
        templateUrl: 'app/components/createRegistry/createregistry.html',
        controller: 'CreateRegistryController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('actions.create.secret', {
    url: '/secret',
    views: {
      'content@': {
        templateUrl: 'app/components/createSecret/createsecret.html',
        controller: 'CreateSecretController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('actions.create.service', {
    url: '/service',
    views: {
      'content@': {
        templateUrl: 'app/components/createService/createservice.html',
        controller: 'CreateServiceController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('actions.create.volume', {
    url: '/volume',
    views: {
      'content@': {
        templateUrl: 'app/components/createVolume/createvolume.html',
        controller: 'CreateVolumeController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('init', {
    abstract: true,
    url: '/init',
    views: {
      'content@': {
        template: '<div ui-view="content@"></div>'
      }
    }
  })
  .state('init.endpoint', {
    url: '/endpoint',
    views: {
      'content@': {
        templateUrl: 'app/components/initEndpoint/initEndpoint.html',
        controller: 'InitEndpointController'
      }
    }
  })
  .state('init.admin', {
    url: '/admin',
    views: {
      'content@': {
        templateUrl: 'app/components/initAdmin/initAdmin.html',
        controller: 'InitAdminController'
      }
    }
  })
  .state('engine', {
    url: '/engine/',
    views: {
      'content@': {
        templateUrl: 'app/components/engine/engine.html',
        controller: 'EngineController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('endpoints', {
    url: '/endpoints/',
    views: {
      'content@': {
        templateUrl: 'app/components/endpoints/endpoints.html',
        controller: 'EndpointsController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('endpoint', {
    url: '^/endpoints/:id',
    views: {
      'content@': {
        templateUrl: 'app/components/endpoint/endpoint.html',
        controller: 'EndpointController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('endpoint.access', {
    url: '^/endpoints/:id/access',
    views: {
      'content@': {
        templateUrl: 'app/components/endpointAccess/endpointAccess.html',
        controller: 'EndpointAccessController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('events', {
    url: '/events/',
    views: {
      'content@': {
        templateUrl: 'app/components/events/events.html',
        controller: 'EventsController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('images', {
    url: '/images/',
    views: {
      'content@': {
        templateUrl: 'app/components/images/images.html',
        controller: 'ImagesController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('image', {
    url: '^/images/:id/',
    views: {
      'content@': {
        templateUrl: 'app/components/image/image.html',
        controller: 'ImageController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('networks', {
    url: '/networks/',
    views: {
      'content@': {
        templateUrl: 'app/components/networks/networks.html',
        controller: 'NetworksController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('network', {
    url: '^/networks/:id/',
    views: {
      'content@': {
        templateUrl: 'app/components/network/network.html',
        controller: 'NetworkController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('node', {
    url: '^/nodes/:id/',
    views: {
      'content@': {
        templateUrl: 'app/components/node/node.html',
        controller: 'NodeController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('registries', {
    url: '/registries/',
    views: {
      'content@': {
        templateUrl: 'app/components/registries/registries.html',
        controller: 'RegistriesController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('registry', {
    url: '^/registries/:id',
    views: {
      'content@': {
        templateUrl: 'app/components/registry/registry.html',
        controller: 'RegistryController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('registry.access', {
    url: '^/registries/:id/access',
    views: {
      'content@': {
        templateUrl: 'app/components/registryAccess/registryAccess.html',
        controller: 'RegistryAccessController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('secrets', {
    url: '^/secrets/',
    views: {
      'content@': {
        templateUrl: 'app/components/secrets/secrets.html',
        controller: 'SecretsController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('secret', {
    url: '^/secret/:id/',
    views: {
      'content@': {
        templateUrl: 'app/components/secret/secret.html',
        controller: 'SecretController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('services', {
    url: '/services/',
    views: {
      'content@': {
        templateUrl: 'app/components/services/services.html',
        controller: 'ServicesController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('service', {
    url: '^/service/:id/',
    views: {
      'content@': {
        templateUrl: 'app/components/service/service.html',
        controller: 'ServiceController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('settings', {
    url: '/settings/',
    views: {
      'content@': {
        templateUrl: 'app/components/settings/settings.html',
        controller: 'SettingsController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('settings_authentication', {
    url: '^/settings/authentication',
    views: {
      'content@': {
        templateUrl: 'app/components/settingsAuthentication/settingsAuthentication.html',
        controller: 'SettingsAuthenticationController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('task', {
    url: '^/task/:id',
    views: {
      'content@': {
        templateUrl: 'app/components/task/task.html',
        controller: 'TaskController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('templates', {
    url: '/templates/',
    params: {
      key: 'containers',
      hide_descriptions: false
    },
    views: {
      'content@': {
        templateUrl: 'app/components/templates/templates.html',
        controller: 'TemplatesController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('templates_linuxserver', {
    url: '^/templates/linuxserver.io',
    params: {
      key: 'linuxserver.io',
      hide_descriptions: true
    },
    views: {
      'content@': {
        templateUrl: 'app/components/templates/templates.html',
        controller: 'TemplatesController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('volumes', {
    url: '/volumes/',
    views: {
      'content@': {
        templateUrl: 'app/components/volumes/volumes.html',
        controller: 'VolumesController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('volume', {
    url: '^/volumes/:id',
    views: {
      'content@': {
        templateUrl: 'app/components/volume/volume.html',
        controller: 'VolumeController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('users', {
    url: '/users/',
    views: {
      'content@': {
        templateUrl: 'app/components/users/users.html',
        controller: 'UsersController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('user', {
    url: '^/users/:id',
    views: {
      'content@': {
        templateUrl: 'app/components/user/user.html',
        controller: 'UserController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('userSettings', {
    url: '/userSettings/',
    views: {
      'content@': {
        templateUrl: 'app/components/userSettings/userSettings.html',
        controller: 'UserSettingsController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('teams', {
    url: '/teams/',
    views: {
      'content@': {
        templateUrl: 'app/components/teams/teams.html',
        controller: 'TeamsController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('team', {
    url: '^/teams/:id',
    views: {
      'content@': {
        templateUrl: 'app/components/team/team.html',
        controller: 'TeamController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('swarm', {
    url: '/swarm',
    views: {
      'content@': {
        templateUrl: 'app/components/swarm/swarm.html',
        controller: 'SwarmController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  })
  .state('swarm.visualizer', {
    url: '/visualizer',
    views: {
      'content@': {
        templateUrl: 'app/components/swarmVisualizer/swarmVisualizer.html',
        controller: 'SwarmVisualizerController'
      },
      'sidebar@': {
        templateUrl: 'app/components/sidebar/sidebar.html',
        controller: 'SidebarController'
      }
    }
  });
}
