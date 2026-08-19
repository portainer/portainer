angular.module('portainer.oauth').factory('OAuth', [
  '$resource',
  'API_ENDPOINT_OAUTH',
  function OAuthFactory($resource, API_ENDPOINT_OAUTH) {
    'use strict';
    return $resource(
      API_ENDPOINT_OAUTH + '/:action',
      {},
      {
        validate: {
          method: 'POST',
          ignoreLoadingBar: true,
          params: {
            action: 'validate',
          },
        },
      }
    );
  },
]);
