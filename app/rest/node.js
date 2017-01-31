angular.module('portainer.rest')
.factory('Node', ['$resource', 'Settings', function NodeFactory($resource, Settings) {
  'use strict';
  return $resource(Settings.url + '/nodes/:id/:action', {}, {
    query: {method: 'GET', isArray: true},
    get: {method: 'GET', params: {id: '@id'}},
    update: { method: 'POST', params: {id: '@id', action: 'update', version: '@version'} },
    remove: { method: 'DELETE', params: {id: '@id'} }
  });
}]);
