const API_ENDPOINT_TEAM_MEMBERSHIPS = 'api/team_memberships';

angular.module('portainer.app').factory('TeamMemberships', [
  '$resource',
  function TeamMembershipsFactory($resource) {
    'use strict';
    return $resource(
      API_ENDPOINT_TEAM_MEMBERSHIPS + '/:id/:action',
      {},
      {
        create: { method: 'POST', ignoreLoadingBar: true },
        query: { method: 'GET', isArray: true },
        update: { method: 'PUT', params: { id: '@id' } },
        remove: { method: 'DELETE', params: { id: '@id' } },
      }
    );
  },
]);
