angular.module('portainer.rest')
.factory('Service', ['$resource', 'Settings', function ServiceFactory($resource, Settings) {
  'use strict';
  return $resource(Settings.url + '/services/:id/:action', {}, {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true },
    create: { method: 'POST', params: {action: 'create'} },
    update: { method: 'POST', params: {id: '@id', action: 'update', version: '@version'} },
    remove: { method: 'DELETE', params: {id: '@id'} }
  });
}]);
