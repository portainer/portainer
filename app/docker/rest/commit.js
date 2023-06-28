angular.module('portainer.docker').factory('Commit', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  function CommitFactory($resource, API_ENDPOINT_ENDPOINTS) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:environmentId/docker/commit',
      {},
      {
        commitContainer: { method: 'POST', params: { container: '@id', repo: '@repo' }, ignoreLoadingBar: true },
      }
    );
  },
]);
