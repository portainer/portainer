import {genericHandler} from './response/handlers';

angular.module('portainer.docker')
.factory('Volume', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', 'VolumesInterceptor',
  function VolumeFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, VolumesInterceptor) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/volumes/:id/:action',
  {
    endpointId: EndpointProvider.endpointID
  },
  {
    query: { method: 'GET', interceptor: VolumesInterceptor, timeout: 15000},
    get: { method: 'GET', params: {id: '@id'} },
    create: {method: 'POST', params: {action: 'create'}, transformResponse: genericHandler, ignoreLoadingBar: true},
    remove: {
      method: 'DELETE', transformResponse: genericHandler, params: {id: '@id'}
    }
  });
}]);
