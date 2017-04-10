angular.module('portainer.rest')
.factory('Task', ['$resource', 'Settings', 'EndpointProvider', function TaskFactory($resource, Settings, EndpointProvider) {
  'use strict';
  return $resource(Settings.url + '/:endpointId/tasks/:id', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true, params: {filters: '@filters'} }
  });
}]);
