angular.module('portainer.rest')
.factory('Swarm', ['$resource', 'Settings', 'EndpointProvider', function SwarmFactory($resource, Settings, EndpointProvider) {
  'use strict';
  return $resource(Settings.url + '/:endpointId/swarm', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: {method: 'GET'}
  });
}]);
