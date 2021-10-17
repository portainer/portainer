angular.module('portainer.oauth').factory('OAuth', [
  '$resource',
  '$browser',
  'API_ENDPOINT_OAUTH',
  function OAuthFactory($resource, $browser, API_ENDPOINT_OAUTH) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_OAUTH}/:action`,
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
