angular.module('portainer.app').factory('Users', [
  '$resource',
  'API_ENDPOINT_USERS',
  function UsersFactory($resource, API_ENDPOINT_USERS) {
    'use strict';
    return $resource(
      API_ENDPOINT_USERS + '/:id/:entity/:entityId',
      {},
      {
        create: { method: 'POST', ignoreLoadingBar: true },
        query: { method: 'GET', isArray: true },
        get: { method: 'GET', params: { id: '@id' } },
        update: { method: 'PUT', params: { id: '@id' }, ignoreLoadingBar: true },
        updatePassword: { method: 'PUT', params: { id: '@id', entity: 'passwd' } },
        remove: { method: 'DELETE', params: { id: '@id' } },
        queryMemberships: { method: 'GET', isArray: true, params: { id: '@id', entity: 'memberships' } },
        checkAdminUser: { method: 'GET', params: { id: 'admin', entity: 'check' }, isArray: true, ignoreLoadingBar: true },
        initAdminUser: { method: 'POST', params: { id: 'admin', entity: 'init' }, ignoreLoadingBar: true },
      }
    );
  },
]);
