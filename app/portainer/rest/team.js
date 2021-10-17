angular.module('portainer.app').factory('Teams', [
  '$resource',
  '$browser',
  'API_ENDPOINT_TEAMS',
  function TeamsFactory($resource, $browser, API_ENDPOINT_TEAMS) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_TEAMS}/:id/:entity/:entityId`,
      {},
      {
        create: { method: 'POST', ignoreLoadingBar: true },
        query: { method: 'GET', isArray: true },
        get: { method: 'GET', params: { id: '@id' } },
        remove: { method: 'DELETE', params: { id: '@id' } },
        queryMemberships: { method: 'GET', isArray: true, params: { id: '@id', entity: 'memberships' } },
      }
    );
  },
]);
