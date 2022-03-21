angular.module('portainer.app').factory('RedirectStatusInterceptor', [
  '$q',
  '$window',
  function ($q, $window) {
    'use strict';
    var interceptor = {};

    interceptor.responseError = responseErrorInterceptor;

    function responseErrorInterceptor(rejection) {
      if (rejection.status === 307 || rejection.status === 308) {
        var redirectReason = rejection.headers()['redirect_reason'];
        if (redirectReason === 'AdminInitTimeout') {
          $window.location.href = '/#!/init/timeout';
        }

        return $q.reject(rejection);
      }
      return $q.reject(rejection);
    }

    return interceptor;
  },
]);
