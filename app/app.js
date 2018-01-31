angular.module('portainer')
.run(['$rootScope', '$state', 'Authentication', 'authManager', 'StateManager', 'EndpointProvider', 'Notifications', 'Analytics', 'cfpLoadingBar', function ($rootScope, $state, Authentication, authManager, StateManager, EndpointProvider, Notifications, Analytics, cfpLoadingBar) {
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
}]);


function initAuthentication(authManager, Authentication, $rootScope, $state) {
  authManager.checkAuthOnRefresh();
  authManager.redirectWhenUnauthenticated();
  Authentication.init();
  $rootScope.$on('tokenHasExpired', function() {
    $state.go('portainer.auth', {error: 'Your session has expired'});
  });
}

function initAnalytics(Analytics, $rootScope) {
  Analytics.offline(false);
  Analytics.registerScriptTags();
  Analytics.registerTrackers();
  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    Analytics.trackPage(toState.url);
    Analytics.pageView();
  });
}
