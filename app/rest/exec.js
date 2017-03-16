angular.module('portainer.rest')
.factory('Exec', ['$resource', 'Settings', 'EndpointProvider', function ExecFactory($resource, Settings, EndpointProvider) {
  'use strict';
  return $resource(Settings.url + '/:endpointId/exec/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    resize: {
      method: 'POST', params: {id: '@id', action: 'resize', h: '@height', w: '@width'},
      transformResponse: genericHandler
    }
  });
}]);
