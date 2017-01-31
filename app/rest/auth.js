angular.module('portainer.rest')
.factory('Auth', ['$resource', 'AUTH_ENDPOINT', function AuthFactory($resource, AUTH_ENDPOINT) {
  'use strict';
  return $resource(AUTH_ENDPOINT, {}, {
    login: {
      method: 'POST'
    }
  });
}]);
