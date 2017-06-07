angular.module('portainer.rest')
.factory('Exec', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function ExecFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/exec/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    resize: {
      method: 'POST', params: {id: '@id', action: 'resize', h: '@height', w: '@width'},
      transformResponse: genericHandler
    }
  });
}]);
