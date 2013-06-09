'use strict';

angular.module('dockerui', ['dockerui.services', 'dockerui.filters'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {templateUrl: 'partials/home.html', controller: 'HomeController'});
        $routeProvider.when('/containers/', {templateUrl: 'partials/containers.html', controller: 'ContainersController'});
        $routeProvider.when('/containers/:id/', {templateUrl: 'partials/container.html', controller: 'ContainerController'});
        $routeProvider.when('/images/', {templateUrl: 'partials/images.html', controller: 'ImagesController'});
        $routeProvider.when('/images/:id/', {templateUrl: 'partials/image.html', controller: 'ImageController'});
        $routeProvider.when('/settings', {templateUrl: 'partials/settings.html', controller: 'SettingsController'});
        $routeProvider.otherwise({redirectTo: '/'});
    }])
    .constant('DOCKER_ENDPOINT', 'http://192.168.1.9:4243\:4243');
