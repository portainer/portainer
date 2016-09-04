angular.module('portainer', [
  'portainer.templates',
  'ui.bootstrap',
  'ui.router',
  'ui.select',
  'ngCookies',
  'ngSanitize',
  'portainer.services',
  'portainer.helpers',
  'portainer.filters',
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
  'stats',
  'swarm',
  'network',
  'networks',
  'templates',
  'volumes'])
  .config(['$stateProvider', '$urlRouterProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider, $httpProvider) {
    'use strict';

    $httpProvider.defaults.xsrfCookieName = 'csrfToken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRF-Token';

    $urlRouterProvider.otherwise('/');

    $stateProvider
    .state('index', {
      url: '/',
      templateUrl: 'app/components/dashboard/dashboard.html',
      controller: 'DashboardController'
    })
    .state('containers', {
      url: '/containers/',
      templateUrl: 'app/components/containers/containers.html',
      controller: 'ContainersController'
    })
    .state('container', {
      url: "^/containers/:id",
      templateUrl: 'app/components/container/container.html',
      controller: 'ContainerController'
    })
    .state('stats', {
      url: "^/containers/:id/stats",
      templateUrl: 'app/components/stats/stats.html',
      controller: 'StatsController'
    })
    .state('logs', {
      url: "^/containers/:id/logs",
      templateUrl: 'app/components/containerLogs/containerlogs.html',
      controller: 'ContainerLogsController'
    })
    .state('console', {
      url: "^/containers/:id/console",
      templateUrl: 'app/components/containerConsole/containerConsole.html',
      controller: 'ContainerConsoleController'
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
      controller: 'CreateContainerController'
    })
    .state('actions.create.volume', {
      url: "/volume",
      templateUrl: 'app/components/createVolume/createvolume.html',
      controller: 'CreateVolumeController'
    })
    .state('actions.create.network', {
      url: "/network",
      templateUrl: 'app/components/createNetwork/createnetwork.html',
      controller: 'CreateNetworkController'
    })
    .state('docker', {
      url: '/docker/',
      templateUrl: 'app/components/docker/docker.html',
      controller: 'DockerController'
    })
    .state('events', {
      url: '/events/',
      templateUrl: 'app/components/events/events.html',
      controller: 'EventsController'
    })
    .state('images', {
      url: '/images/',
      templateUrl: 'app/components/images/images.html',
      controller: 'ImagesController'
    })
    .state('image', {
      url: '^/images/:id/',
      templateUrl: 'app/components/image/image.html',
      controller: 'ImageController'
    })
    .state('networks', {
      url: '/networks/',
      templateUrl: 'app/components/networks/networks.html',
      controller: 'NetworksController'
    })
    .state('network', {
      url: '^/networks/:id/',
      templateUrl: 'app/components/network/network.html',
      controller: 'NetworkController'
    })
    .state('templates', {
      url: '/templates/',
      templateUrl: 'app/components/templates/templates.html',
      controller: 'TemplatesController'
    })
    .state('volumes', {
      url: '/volumes/',
      templateUrl: 'app/components/volumes/volumes.html',
      controller: 'VolumesController'
    })
    .state('swarm', {
      url: '/swarm/',
      templateUrl: 'app/components/swarm/swarm.html',
      controller: 'SwarmController'
    });

    // The Docker API likes to return plaintext errors, this catches them and disp
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
          var csrfToken = response.headers('X-Csrf-Token');
          if (csrfToken) {
            document.cookie = 'csrfToken=' + csrfToken;
          }
          return response;
        }
      };
    });
  }])

  // This is your docker url that the api will use to make requests
  // You need to set this to the api endpoint without the port i.e. http://192.168.1.9
  .constant('DOCKER_ENDPOINT', 'dockerapi')
  .constant('DOCKER_PORT', '') // Docker port, leave as an empty string if no port is requred.  If you have a port, prefix it with a ':' i.e. :4243
  .constant('CONFIG_ENDPOINT', 'settings')
  .constant('TEMPLATES_ENDPOINT', 'templates')
  .constant('UI_VERSION', 'v1.7.0');
