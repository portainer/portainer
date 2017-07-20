angular.module('portainer.rest')
.factory('ContainerCommit', ['$resource', 'ENDPOINTS_ENDPOINT', 'EndpointProvider', function ContainerCommitFactory($resource, ENDPOINTS_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(ENDPOINTS_ENDPOINT + '/:endpointId/docker/commit', {
    endpointId: EndpointProvider.endpointID
  },
  {
    commit: {method: 'POST', params: {container: '@id', repo: '@repo', tag: '@tag'}}
  });
}]);
