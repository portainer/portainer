angular.module('portainer.rest')
.factory('Events', ['$resource', 'Settings', 'EndpointProvider', function EventFactory($resource, Settings, EndpointProvider) {
  'use strict';
  return $resource(Settings.url + '/:endpointId/events', {
    endpointId: EndpointProvider.endpointID
  },
  {
    query: {
      method: 'GET', params: {since: '@since', until: '@until'},
      isArray: true, transformResponse: jsonObjectsToArrayHandler
    }
  });
}]);
