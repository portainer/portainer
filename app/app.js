angular.module('portainer', [
  'portainer.templates',
  'ui.bootstrap',
  'ui.router',
  'ui.select',
  'ngCookies',
  'ngSanitize',
  'angularUtils.directives.dirPagination',
  'angular-jwt',
  'LocalStorageModule',
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
  'service',
  'services',
  'settings',
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
  .config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'localStorageServiceProvider', function ($stateProvider, $urlRouterProvider, $httpProvider, localStorageServiceProvider) {
    'use strict';

    localStorageServiceProvider
    .setStorageType('sessionStorage')
    .setPrefix('portainer');

    $urlRouterProvider.otherwise('/dashboard');

    $stateProvider
    .state('auth', {
      url: '/auth',
      params: {
        logout: false
      },
      templateUrl: 'app/components/auth/auth.html',
      controller: 'AuthenticationController'
    })
    .state('containers', {
      url: '/containers/',
      templateUrl: 'app/components/containers/containers.html',
      controller: 'ContainersController',
      authenticate: true
    })
    .state('container', {
      url: "^/containers/:id",
      templateUrl: 'app/components/container/container.html',
      controller: 'ContainerController',
      authenticate: true
    })
    .state('stats', {
      url: "^/containers/:id/stats",
      templateUrl: 'app/components/stats/stats.html',
      controller: 'StatsController',
      authenticate: true
    })
    .state('logs', {
      url: "^/containers/:id/logs",
      templateUrl: 'app/components/containerLogs/containerlogs.html',
      controller: 'ContainerLogsController',
      authenticate: true
    })
    .state('console', {
      url: "^/containers/:id/console",
      templateUrl: 'app/components/containerConsole/containerConsole.html',
      controller: 'ContainerConsoleController',
      authenticate: true
    })
    .state('dashboard', {
      url: '/dashboard',
      templateUrl: 'app/components/dashboard/dashboard.html',
      controller: 'DashboardController',
      authenticate: true
    })
    .state('actions', {
      abstract: true,
      url: "/actions",
      template: '<ui-view/>'
    })
    .state('actions.create', {
      abstract: true,
      url: "/create",
      template: '<ui-view/>'
    })
    .state('actions.create.container', {
      url: "/container",
      templateUrl: 'app/components/createContainer/createcontainer.html',
      controller: 'CreateContainerController',
      authenticate: true
    })
    .state('actions.create.network', {
      url: "/network",
      templateUrl: 'app/components/createNetwork/createnetwork.html',
      controller: 'CreateNetworkController',
      authenticate: true
    })
    .state('actions.create.service', {
      url: "/service",
      templateUrl: 'app/components/createService/createservice.html',
      controller: 'CreateServiceController',
      authenticate: true
    })
    .state('actions.create.volume', {
      url: "/volume",
      templateUrl: 'app/components/createVolume/createvolume.html',
      controller: 'CreateVolumeController',
      authenticate: true
    })
    .state('docker', {
      url: '/docker/',
      templateUrl: 'app/components/docker/docker.html',
      controller: 'DockerController',
      authenticate: true
    })
    .state('events', {
      url: '/events/',
      templateUrl: 'app/components/events/events.html',
      controller: 'EventsController',
      authenticate: true
    })
    .state('images', {
      url: '/images/',
      templateUrl: 'app/components/images/images.html',
      controller: 'ImagesController',
      authenticate: true
    })
    .state('image', {
      url: '^/images/:id/',
      templateUrl: 'app/components/image/image.html',
      controller: 'ImageController',
      authenticate: true
    })
    .state('networks', {
      url: '/networks/',
      templateUrl: 'app/components/networks/networks.html',
      controller: 'NetworksController',
      authenticate: true
    })
    .state('network', {
      url: '^/networks/:id/',
      templateUrl: 'app/components/network/network.html',
      controller: 'NetworkController',
      authenticate: true
    })
    .state('services', {
      url: '/services/',
      templateUrl: 'app/components/services/services.html',
      controller: 'ServicesController',
      authenticate: true
    })
    .state('service', {
      url: '^/service/:id/',
      templateUrl: 'app/components/service/service.html',
      controller: 'ServiceController',
      authenticate: true
    })
    .state('settings', {
      url: '/settings/',
      templateUrl: 'app/components/settings/settings.html',
      controller: 'SettingsController',
      authenticate: true
    })
    .state('task', {
      url: '^/task/:id',
      templateUrl: 'app/components/task/task.html',
      controller: 'TaskController',
      authenticate: true
    })
    .state('templates', {
      url: '/templates/',
      templateUrl: 'app/components/templates/templates.html',
      controller: 'TemplatesController',
      authenticate: true
    })
    .state('volumes', {
      url: '/volumes/',
      templateUrl: 'app/components/volumes/volumes.html',
      controller: 'VolumesController',
      authenticate: true
    })
    .state('swarm', {
      url: '/swarm/',
      templateUrl: 'app/components/swarm/swarm.html',
      controller: 'SwarmController',
      authenticate: true
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
  .run(function ($rootScope, $state, Authentication) {
    Authentication.init();
    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
      if (toState.authenticate && !Authentication.isAuthenticated()){
        $state.transitionTo("auth");
        event.preventDefault();
      }
    });
    $rootScope.$state = $state;
  })
  // This is your docker url that the api will use to make requests
  // You need to set this to the api endpoint without the port i.e. http://192.168.1.9
  .constant('DOCKER_ENDPOINT', 'dockerapi')
  .constant('DOCKER_PORT', '') // Docker port, leave as an empty string if no port is requred.  If you have a port, prefix it with a ':' i.e. :4243
  .constant('CONFIG_ENDPOINT', 'settings')
  .constant('AUTH_ENDPOINT', 'auth')
  .constant('TEMPLATES_ENDPOINT', 'templates')
  .constant('PAGINATION_MAX_ITEMS', 10)
  .constant('UI_VERSION', 'v1.10.2');
