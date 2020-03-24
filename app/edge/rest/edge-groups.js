angular.module('portainer.edge')
.factory('EdgeGroups', function EdgeGroupsFactory($resource, API_ENDPOINT_EDGE_GROUPS) {
  'use strict';
  return $resource(API_ENDPOINT_EDGE_GROUPS + '/:id/:action', {}, {
    create: { method: 'POST', ignoreLoadingBar: true },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
});
