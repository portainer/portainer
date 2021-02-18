const API_ENDPOINT_AUTH = 'api/auth';

angular.module('portainer.app').factory('Auth', [
  '$resource',
  function AuthFactory($resource) {
    'use strict';
    return $resource(
      API_ENDPOINT_AUTH + '/:action',
      {},
      {
        login: { method: 'POST', ignoreLoadingBar: true },
        logout: { method: 'POST', params: { action: 'logout' }, ignoreLoadingBar: true },
      }
    );
  },
]);
