angular.module('portainer.app')
.factory('Schedules', ['$resource', 'API_ENDPOINT_SCHEDULES',
function SchedulesFactory($resource, API_ENDPOINT_SCHEDULES) {
  'use strict';
  return $resource(API_ENDPOINT_SCHEDULES + '/:id', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
