angular.module('portainer.docker')
.factory('ContainerCommit', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function ContainerCommitFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/commit', {
    endpointId: EndpointProvider.endpointID
  },
  {
    commit: {method: 'POST', params: {container: '@id', repo: '@repo', tag: '@tag'}, ignoreLoadingBar: true}
  });
}]);
