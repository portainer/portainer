angular.module('portainer.rest')
.factory('ContainerCommit', ['$resource', 'Settings', 'EndpointProvider', function ContainerCommitFactory($resource, Settings, EndpointProvider) {
  'use strict';
  return $resource(Settings.url + '/:endpointId/commit', {
    endpointId: EndpointProvider.endpointID
  },
  {
    commit: {method: 'POST', params: {container: '@id', repo: '@repo', tag: '@tag'}}
  });
}]);
