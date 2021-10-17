angular.module('portainer.docker').factory('Commit', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function CommitFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/commit`,
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        commitContainer: { method: 'POST', params: { container: '@id', repo: '@repo' }, ignoreLoadingBar: true },
      }
    );
  },
]);
