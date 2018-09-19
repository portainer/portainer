angular.module('portainer.app')
.factory('PortainerPlugin', ['$resource', 'API_ENDPOINT_PLUGINS',
 function PortainerPluginFactory($resource, API_ENDPOINT_PLUGINS) {
  'use strict';
  return $resource(API_ENDPOINT_PLUGINS, {}, {
    create: { method: 'POST' }
  });
}]);
