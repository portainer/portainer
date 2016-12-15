angular.module('portainer', [
  'portainer.templates',
  'ui.bootstrap',
  'ui.router',
  'ui.select',
  'ngCookies',
  'ngSanitize',
  'angularUtils.directives.dirPagination',
  'LocalStorageModule',
  'angular-jwt',
  'portainer.services',
  'portainer.helpers',
  'portainer.filters',
  'auth',
  'dashboard',
  'container',
  'containerConsole',
  'containerLogs',
  'containers',
  'createContainer',
  'docker',
  'events',
  'images',
  'image',
  'main',
  'service',
  'services',
  'settings',
  'sidebar',
  'createService',
  'stats',
  'swarm',
  'network',
  'networks',
  'createNetwork',
  'task',
  'templates',
  'volumes',
  'createVolume'])
  .config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'localStorageServiceProvider', 'jwtOptionsProvider', function ($stateProvider, $urlRouterProvider, $httpProvider, localStorageServiceProvider, jwtOptionsProvider) {
    'use strict';

    localStorageServiceProvider
    .setStorageType('sessionStorage')
    .setPrefix('portainer');

    jwtOptionsProvider.config({
      tokenGetter: ['localStorageService', function(localStorageService) {
        return localStorageService.get('JWT');
      }],
      unauthenticatedRedirector: ['$state', function($state) {
        $state.go('auth', {error: 'Your session has expired'});
      }]
    });
    $httpProvider.interceptors.push('jwtInterceptor');

    $urlRouterProvider.otherwise('/auth');

    $stateProvider
    .state('auth', {
      url: '/auth',
      params: {
        logout: false,
        error: ''
      },
      views: {
        "content": {
          templateUrl: 'app/components/auth/auth.html',
          controller: 'AuthenticationController'
        }
      }
    })
    .state('containers', {
      url: '/containers/',
      views: {
        "content": {
          templateUrl: 'app/components/containers/containers.html',
          controller: 'ContainersController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('container', {
      url: "^/containers/:id",
      views: {
        "content": {
          templateUrl: 'app/components/container/container.html',
          controller: 'ContainerController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('stats', {
      url: "^/containers/:id/stats",
      views: {
        "content": {
          templateUrl: 'app/components/stats/stats.html',
          controller: 'StatsController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('logs', {
      url: "^/containers/:id/logs",
      views: {
        "content": {
          templateUrl: 'app/components/containerLogs/containerlogs.html',
          controller: 'ContainerLogsController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('console', {
      url: "^/containers/:id/console",
      views: {
        "content": {
          templateUrl: 'app/components/containerConsole/containerConsole.html',
          controller: 'ContainerConsoleController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('dashboard', {
      url: '/dashboard',
      views: {
        "content": {
          templateUrl: 'app/components/dashboard/dashboard.html',
          controller: 'DashboardController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('actions', {
      abstract: true,
      url: "/actions",
      views: {
        "content": {
          template: '<div ui-view="content"></div>'
        },
        "sidebar": {
          template: '<div ui-view="sidebar"></div>'
        }
      }
    })
    .state('actions.create', {
      abstract: true,
      url: "/create",
      views: {
        "content": {
          template: '<div ui-view="content"></div>'
        },
        "sidebar": {
          template: '<div ui-view="sidebar"></div>'
        }
      }
    })
    .state('actions.create.container', {
      url: "/container",
      views: {
        "content": {
          templateUrl: 'app/components/createContainer/createcontainer.html',
          controller: 'CreateContainerController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('actions.create.network', {
      url: "/network",
      views: {
        "content": {
          templateUrl: 'app/components/createNetwork/createnetwork.html',
          controller: 'CreateNetworkController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('actions.create.service', {
      url: "/service",
      views: {
        "content": {
          templateUrl: 'app/components/createService/createservice.html',
          controller: 'CreateServiceController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('actions.create.volume', {
      url: "/volume",
      views: {
        "content": {
          templateUrl: 'app/components/createVolume/createvolume.html',
          controller: 'CreateVolumeController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('docker', {
      url: '/docker/',
      views: {
        "content": {
          templateUrl: 'app/components/docker/docker.html',
          controller: 'DockerController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('events', {
      url: '/events/',
      views: {
        "content": {
          templateUrl: 'app/components/events/events.html',
          controller: 'EventsController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('images', {
      url: '/images/',
      views: {
        "content": {
          templateUrl: 'app/components/images/images.html',
          controller: 'ImagesController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('image', {
      url: '^/images/:id/',
      views: {
        "content": {
          templateUrl: 'app/components/image/image.html',
          controller: 'ImageController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('networks', {
      url: '/networks/',
      views: {
        "content": {
          templateUrl: 'app/components/networks/networks.html',
          controller: 'NetworksController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('network', {
      url: '^/networks/:id/',
      views: {
        "content": {
          templateUrl: 'app/components/network/network.html',
          controller: 'NetworkController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('services', {
      url: '/services/',
      views: {
        "content": {
          templateUrl: 'app/components/services/services.html',
          controller: 'ServicesController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('service', {
      url: '^/service/:id/',
      views: {
        "content": {
          templateUrl: 'app/components/service/service.html',
          controller: 'ServiceController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('settings', {
      url: '/settings/',
      views: {
        "content": {
          templateUrl: 'app/components/settings/settings.html',
          controller: 'SettingsController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('task', {
      url: '^/task/:id',
      views: {
        "content": {
          templateUrl: 'app/components/task/task.html',
          controller: 'TaskController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('templates', {
      url: '/templates/',
      views: {
        "content": {
          templateUrl: 'app/components/templates/templates.html',
          controller: 'TemplatesController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('volumes', {
      url: '/volumes/',
      views: {
        "content": {
          templateUrl: 'app/components/volumes/volumes.html',
          controller: 'VolumesController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    })
    .state('swarm', {
      url: '/swarm/',
      views: {
        "content": {
          templateUrl: 'app/components/swarm/swarm.html',
          controller: 'SwarmController'
        },
        "sidebar": {
          templateUrl: 'app/components/sidebar/sidebar.html',
          controller: 'SidebarController'
        }
      },
      data: {
        requiresLogin: true
      }
    });

    // The Docker API likes to return plaintext errors, this catches them and disp
    // $httpProvider.defaults.xsrfCookieName = 'csrfToken';
    // $httpProvider.defaults.xsrfHeaderName = 'X-CSRF-Token';
    $httpProvider.interceptors.push(function() {
      return {
        'response': function(response) {
          if (typeof(response.data) === 'string' &&
          (response.data.startsWith('Conflict.') || response.data.startsWith('conflict:'))) {
            $.gritter.add({
              title: 'Error',
              text: $('<div>').text(response.data).html(),
              time: 10000
            });
          }
          // CSRF protection is disabled for the moment
          // var csrfToken = response.headers('X-Csrf-Token');
          // if (csrfToken) {
          //   document.cookie = 'csrfToken=' + csrfToken;
          // }
          return response;
        }
      };
    });
  }])
  .run(['$rootScope', '$state', 'Authentication', 'authManager', 'EndpointMode', function ($rootScope, $state, Authentication, authManager, EndpointMode) {
    authManager.checkAuthOnRefresh();
    authManager.redirectWhenUnauthenticated();
    Authentication.init();
    $rootScope.$state = $state;

    $rootScope.$on('tokenHasExpired', function($state) {
      $state.go('auth', {error: 'Your session has expired'});
    });

    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
      if ((fromState.name === 'auth' || fromState.name === '') && Authentication.isAuthenticated()) {
        EndpointMode.determineEndpointMode();
      }
    });
  }])
  // This is your docker url that the api will use to make requests
  // You need to set this to the api endpoint without the port i.e. http://192.168.1.9
  .constant('DOCKER_ENDPOINT', 'dockerapi')
  .constant('DOCKER_PORT', '') // Docker port, leave as an empty string if no port is required.  If you have a port, prefix it with a ':' i.e. :4243
  .constant('CONFIG_ENDPOINT', 'settings')
  .constant('AUTH_ENDPOINT', 'auth')
  .constant('TEMPLATES_ENDPOINT', 'templates')
  .constant('PAGINATION_MAX_ITEMS', 10)
  .constant('UI_VERSION', 'v1.10.2');
