import { genericHandler } from './response/handlers';

angular.module('portainer.docker').factory('Exec', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function ExecFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/exec/:id/:action`,
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        resize: {
          method: 'POST',
          params: { id: '@id', action: 'resize', h: '@height', w: '@width' },
          transformResponse: genericHandler,
          ignoreLoadingBar: true,
        },
      }
    );
  },
]);
