angular.module('portainer.rest')
.factory('Task', ['$resource', 'Settings', function TaskFactory($resource, Settings) {
  'use strict';
  return $resource(Settings.url + '/tasks/:id', {}, {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true, params: {filters: '@filters'} }
  });
}]);
