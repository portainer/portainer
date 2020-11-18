import toastr from 'toastr';
import { Terminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';

angular.module('portainer').config([
  '$urlRouterProvider',
  '$httpProvider',
  'localStorageServiceProvider',
  'jwtOptionsProvider',
  '$uibTooltipProvider',
  '$compileProvider',
  'cfpLoadingBarProvider',
  function ($urlRouterProvider, $httpProvider, localStorageServiceProvider, jwtOptionsProvider, $uibTooltipProvider, $compileProvider, cfpLoadingBarProvider) {
    'use strict';

    var environment = '@@ENVIRONMENT';
    if (environment === 'production') {
      $compileProvider.debugInfoEnabled(false);
    }

    localStorageServiceProvider.setPrefix('portainer');

    jwtOptionsProvider.config({
      tokenGetter: [
        'LocalStorage',
        function (LocalStorage) {
          return LocalStorage.getJWT();
        },
      ],
    });

    $httpProvider.interceptors.push('jwtInterceptor');
    $httpProvider.interceptors.push('EndpointStatusInterceptor');
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
    $httpProvider.defaults.headers.put['Content-Type'] = 'application/json';
    $httpProvider.defaults.headers.patch['Content-Type'] = 'application/json';

    if (!$httpProvider.defaults.headers.get) {
      $httpProvider.defaults.headers.get = {};
    }
    //disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    // disable cache AB#160
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

    $httpProvider.interceptors.push([
      'HttpRequestHelper',
      function (HttpRequestHelper) {
        return {
          request: function (config) {
            if (config.url.indexOf('/docker/') > -1) {
              config.headers['X-PortainerAgent-Target'] = HttpRequestHelper.portainerAgentTargetHeader();
              if (HttpRequestHelper.portainerAgentManagerOperation()) {
                config.headers['X-PortainerAgent-ManagerOperation'] = '1';
              }
            }
            return config;
          },
        };
      },
    ]);

    toastr.options.timeOut = 3000;

    Terminal.applyAddon(fit);

    $uibTooltipProvider.setTriggers({
      mouseenter: 'mouseleave',
      click: 'click',
      focus: 'blur',
      outsideClick: 'outsideClick',
    });

    cfpLoadingBarProvider.includeSpinner = false;
    cfpLoadingBarProvider.parentSelector = '#loadingbar-placeholder';
    cfpLoadingBarProvider.latencyThreshold = 600;

    $urlRouterProvider.otherwise('/auth');
  },
]);
