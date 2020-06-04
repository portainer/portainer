import angular from 'angular';

angular.module('portainer.edge').factory('EdgeStacks', function EdgeStacksFactory($resource, API_ENDPOINT_EDGE_STACKS) {
  return $resource(
    API_ENDPOINT_EDGE_STACKS + '/:id/:action',
    {},
    {
      create: { method: 'POST', ignoreLoadingBar: true },
      query: { method: 'GET', isArray: true },
      get: { method: 'GET', params: { id: '@id' } },
      update: { method: 'PUT', params: { id: '@id' } },
      remove: { method: 'DELETE', params: { id: '@id' } },
      file: { method: 'GET', params: { id: '@id', action: 'file' } },
    }
  );
});
