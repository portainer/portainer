angular.module('portainer.rest')
.factory('TeamMemberships', ['$resource', 'TEAM_MEMBERSHIPS_ENDPOINT', function TeamMembershipsFactory($resource, TEAM_MEMBERSHIPS_ENDPOINT) {
  'use strict';
  return $resource(TEAM_MEMBERSHIPS_ENDPOINT + '/:id/:action', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
