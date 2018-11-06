angular.module('portainer.app')
.factory('Auth', ['$resource', 'API_ENDPOINT_AUTH', function AuthFactory($resource, API_ENDPOINT_AUTH) {
  'use strict';
  return $resource(API_ENDPOINT_AUTH, {}, {
    login: {
      method: 'POST', ignoreLoadingBar: true
    }
  });
}]);
