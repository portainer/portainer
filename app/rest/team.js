angular.module('portainer.rest')
.factory('Teams', ['$resource', 'TEAMS_ENDPOINT', function TeamsFactory($resource, TEAMS_ENDPOINT) {
  'use strict';
  return $resource(TEAMS_ENDPOINT + '/:id/:entity/:entityId', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} },
    queryMemberships: { method: 'GET', isArray: true, params: { id: '@id', entity: 'memberships' } }
  });
}]);
