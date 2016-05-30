angular.module('uifordocker', [
    'uifordocker.templates',
    'ui.bootstrap',
    'ui.router',
    'ngCookies',
    'ngRoute',
    'dockerui.services',
    'dockerui.filters',
    'masthead',
    'footer',
    'dashboard',
    'container',
    'containers',
    'images',
    'image',
    'pullImage',
    'startContainer',
    'sidebar',
    'info',
    'builder',
    'containerLogs',
    'containerTop',
    'events',
    'stats',
    'swarm',
    'network',
    'networks',
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

        // $routeProvider.when('/containers/', {
        //     templateUrl: 'app/components/containers/containers.html',
        //     controller: 'ContainersController'
        // });
        // $routeProvider.when('/containers/:id/', {
        //     templateUrl: 'app/components/container/container.html',
        //     controller: 'ContainerController'
        // });
        // $routeProvider.when('/containers/:id/logs/', {
        //     templateUrl: 'app/components/containerLogs/containerlogs.html',
        //     controller: 'ContainerLogsController'
        // });
        // $routeProvider.when('/containers/:id/top', {
        //     templateUrl: 'app/components/containerTop/containerTop.html',
        //     controller: 'ContainerTopController'
        // });
        // $routeProvider.when('/containers/:id/stats', {
        //     templateUrl: 'app/components/stats/stats.html',
        //     controller: 'StatsController'
        // });
        // $routeProvider.when('/images/', {
        //     templateUrl: 'app/components/images/images.html',
        //     controller: 'ImagesController'
        // });
        // $routeProvider.when('/images/:id*/', {
        //     templateUrl: 'app/components/image/image.html',
        //     controller: 'ImageController'
        // });
        // $routeProvider.when('/info', {templateUrl: 'app/components/info/info.html', controller: 'InfoController'});
        // $routeProvider.when('/events', {
        //     templateUrl: 'app/components/events/events.html',
        //     controller: 'EventsController'
        // });
        // $routeProvider.otherwise({redirectTo: '/'});

        // The Docker API likes to return plaintext errors, this catches them and disp
        $httpProvider.interceptors.push(function() {
            return {
                'response': function(response) {
                    if (typeof(response.data) === 'string' && response.data.startsWith('Conflict.')) {
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
    .constant('UI_VERSION', 'v0.11.0');
