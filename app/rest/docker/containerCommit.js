angular.module('portainer.rest')
.factory('ContainerCommit', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function ContainerCommitFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/commit', {
    endpointId: EndpointProvider.endpointID
  },
  {
    commit: {method: 'POST', params: {container: '@id', repo: '@repo', tag: '@tag'}}
  });
}]);
