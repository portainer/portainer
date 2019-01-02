angular.module('portainer.extensions.oauth')
.factory('OAuth', ['$resource', 'API_ENDPOINT_OAUTH', function OAuthFactory($resource, API_ENDPOINT_OAUTH) {
  'use strict';
  return $resource(API_ENDPOINT_OAUTH, {}, {
    login: {
      method: 'POST', ignoreLoadingBar: true
    }
  });
}]);