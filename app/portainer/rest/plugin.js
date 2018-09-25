angular.module('portainer.app')
.factory('PortainerPlugin', ['$resource', 'API_ENDPOINT_PLUGINS',
 function PortainerPluginFactory($resource, API_ENDPOINT_PLUGINS) {
  'use strict';
  return $resource(API_ENDPOINT_PLUGINS + '/:id', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } }
  });
}]);
