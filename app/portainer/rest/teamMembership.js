angular.module('portainer.app').factory('TeamMemberships', [
  '$resource',
  '$browser',
  'API_ENDPOINT_TEAM_MEMBERSHIPS',
  function TeamMembershipsFactory($resource, $browser, API_ENDPOINT_TEAM_MEMBERSHIPS) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_TEAM_MEMBERSHIPS}/:id/:action`,
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
