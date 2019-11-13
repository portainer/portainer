import _ from 'lodash-es';
import $ from 'jquery';
import '@babel/polyfill'

angular.module('portainer')
.run(['$rootScope', '$state', '$interval', 'LocalStorage', 'Authentication', 'authManager', 'StateManager', 'EndpointProvider', 'Notifications', 'Analytics', 'SystemService', 'cfpLoadingBar', '$transitions', 'HttpRequestHelper',
function ($rootScope, $state, $interval, LocalStorage, Authentication, authManager, StateManager, EndpointProvider, Notifications, Analytics, SystemService, cfpLoadingBar, $transitions, HttpRequestHelper) {
  'use strict';

  EndpointProvider.initialize();

  StateManager.initialize()
  .then(function success(state) {
    if (state.application.authentication) {
      initAuthentication(authManager, Authentication, $rootScope, $state);
    }
    if (state.application.analytics) {
      initAnalytics(Analytics, $rootScope);
    }
  })
  .catch(function error(err) {
    Notifications.error('Failure', err, 'Unable to retrieve application settings');
  });

  $rootScope.$state = $state;

  // Workaround to prevent the loading bar from going backward
  // https://github.com/chieffancypants/angular-loading-bar/issues/273
  var originalSet = cfpLoadingBar.set;
  cfpLoadingBar.set = function overrideSet(n) {
    if (n > cfpLoadingBar.status()) {
      originalSet.apply(cfpLoadingBar, arguments);
    }
  };

  $transitions.onBefore({}, function() {
    HttpRequestHelper.resetAgentHeaders();
  });

  // Keep-alive Edge endpoints by sending a ping request every minute
  $interval(function() {
    ping(EndpointProvider, SystemService);
  }, 60 * 1000)

  $(document).ajaxSend(function (event, jqXhr, jqOpts) {
    const type = jqOpts.type === 'POST' || jqOpts.type === 'PUT' || jqOpts.type === 'PATCH';
    const hasNoContentType = jqOpts.contentType !== 'application/json' && jqOpts.headers && !jqOpts.headers['Content-Type'];
    if (type && hasNoContentType) {
      jqXhr.setRequestHeader('Content-Type', 'application/json');
    }
    jqXhr.setRequestHeader('Authorization', 'Bearer ' + LocalStorage.getJWT());
  });
}]);

function ping(EndpointProvider, SystemService) {
  let endpoint = EndpointProvider.currentEndpoint();
  if (endpoint !== undefined && endpoint.Type === 4) {
    SystemService.ping(endpoint.Id);
  }
}

function initAuthentication(authManager, Authentication, $rootScope, $state) {
  authManager.checkAuthOnRefresh();
  Authentication.init();

  // The unauthenticated event is broadcasted by the jwtInterceptor when
  // hitting a 401. We're using this instead of the usual combination of
  // authManager.redirectWhenUnauthenticated() + unauthenticatedRedirector
  // to have more controls on which URL should trigger the unauthenticated state.
  $rootScope.$on('unauthenticated', function (event, data) {
    if (!_.includes(data.config.url, '/v2/') && !_.includes(data.config.url, '/api/v4/')) {
      $state.go('portainer.auth', { error: 'Your session has expired' });
    }
  });
}

function initAnalytics(Analytics, $rootScope) {
  Analytics.offline(false);
  Analytics.registerScriptTags();
  Analytics.registerTrackers();
  $rootScope.$on('$stateChangeSuccess', function (event, toState) {
    Analytics.trackPage(toState.url);
    Analytics.pageView();
  });
}
