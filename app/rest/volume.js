angular.module('portainer.rest')
.factory('Volume', ['$resource', 'Settings', 'EndpointProvider', function VolumeFactory($resource, Settings, EndpointProvider) {
  'use strict';
  return $resource(Settings.url + '/:endpointId/volumes/:id/:action',
  {
    endpointId: EndpointProvider.endpointID
  },
  {
    query: { method: 'GET' },
    get: { method: 'GET', params: {id: '@id'} },
    create: {method: 'POST', params: {action: 'create'}, transformResponse: genericHandler},
    remove: {
      method: 'DELETE', transformResponse: genericHandler, params: {id: '@id'}
    }
  });
}]);
