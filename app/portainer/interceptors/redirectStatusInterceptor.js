angular.module('portainer.app').factory('RedirectStatusInterceptor', [
  '$q',
  '$state',
  function ($q, $state) {
    'use strict';
    var interceptor = {};

    interceptor.responseError = responseErrorInterceptor;

    function responseErrorInterceptor(rejection) {
      if (rejection.status === 307 || rejection.status === 308) {
        var redirectReason = rejection.headers()['redirect_reason'];
        if (redirectReason === 'AdminInitTimeout') {
          $state.go('portainer.init.timeout');
        }

        return $q.reject(rejection);
      }
      return $q.reject(rejection);
    }

    return interceptor;
  },
]);
