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
        updateTheme: { method: 'PUT', params: { id: '@id' } },
        remove: { method: 'DELETE', params: { id: '@id' } },
        queryMemberships: { method: 'GET', isArray: true, params: { id: '@id', entity: 'memberships' } },
        checkAdminUser: { method: 'GET', params: { id: 'admin', entity: 'check' }, isArray: true, ignoreLoadingBar: true },
        initAdminUser: {
          method: 'POST',
          params: { id: 'admin', entity: 'init' },
          ignoreLoadingBar: true,
          headers: { 'X-Setup-Token': (config) => config.data.setupToken },
          transformRequest: (data) => {
            // eslint-disable-next-line no-unused-vars
            const { setupToken, ...payload } = data;
            return angular.toJson(payload);
          },
        },
        getAccessTokens: { method: 'GET', params: { id: '@id', entity: 'tokens' }, isArray: true },
        deleteAccessToken: { url: `${API_ENDPOINT_USERS}/:id/tokens/:tokenId`, method: 'DELETE', params: { id: '@id', entityId: '@tokenId' } },
      }
    );
  },
]);
