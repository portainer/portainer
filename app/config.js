angular.module('portainer')
  .config(['$urlRouterProvider', '$locationProvider', '$httpProvider', 'localStorageServiceProvider', 'jwtOptionsProvider', 'AnalyticsProvider', '$uibTooltipProvider', '$compileProvider', 'cfpLoadingBarProvider',
  function ($urlRouterProvider, $locationProvider, $httpProvider, localStorageServiceProvider, jwtOptionsProvider, AnalyticsProvider, $uibTooltipProvider, $compileProvider, cfpLoadingBarProvider) {
    'use strict';

    var environment = '@@ENVIRONMENT';
    if (environment === 'production') {
      $compileProvider.debugInfoEnabled(false);
    }

    localStorageServiceProvider
    .setPrefix('portainer');

    jwtOptionsProvider.config({
      tokenGetter: ['LocalStorage', function(LocalStorage) {
        return LocalStorage.getJWT();
      }],
      unauthenticatedRedirector: ['$state', function($state) {
        $state.go('portainer.auth', {error: 'Your session has expired'});
      }]
    });
    $httpProvider.interceptors.push('jwtInterceptor');
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
    $httpProvider.defaults.headers.put['Content-Type'] = 'application/json';
    $httpProvider.defaults.headers.patch['Content-Type'] = 'application/json';

    $httpProvider.interceptors.push(['HttpRequestHelper', function(HttpRequestHelper) {
      return {
        request: function(config) {
          if (config.url.indexOf('/docker/') > -1) {
            config.headers['X-PortainerAgent-Target'] = HttpRequestHelper.portainerAgentTargetHeader();
          }
          return config;
        }
      };
    }]);

    AnalyticsProvider.setAccount('@@CONFIG_GA_ID');
    AnalyticsProvider.startOffline(true);

    toastr.options.timeOut = 3000;

    Terminal.applyAddon(fit);

    $uibTooltipProvider.setTriggers({
      'mouseenter': 'mouseleave',
      'click': 'click',
      'focus': 'blur',
      'outsideClick': 'outsideClick'
    });

    cfpLoadingBarProvider.includeSpinner = false;
    cfpLoadingBarProvider.parentSelector = '#loadingbar-placeholder';

    $urlRouterProvider.otherwise('/auth');
    $locationProvider.html5Mode({
      'enabled': true, 
      'requireBase': false
    });
  }]);
