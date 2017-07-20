angular.module('portainer.rest')
.factory('Exec', ['$resource', 'ENDPOINTS_ENDPOINT', 'EndpointProvider', function ExecFactory($resource, ENDPOINTS_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(ENDPOINTS_ENDPOINT + '/:endpointId/docker/exec/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    resize: {
      method: 'POST', params: {id: '@id', action: 'resize', h: '@height', w: '@width'},
      transformResponse: genericHandler
    }
  });
}]);
