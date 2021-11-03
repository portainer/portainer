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

    if (process.env.NODE_ENV === 'testing') {
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
