angular.module('portainer.rest')
.factory('Users', ['$resource', 'API_ENDPOINT_USERS', function UsersFactory($resource, API_ENDPOINT_USERS) {
  'use strict';
  return $resource(API_ENDPOINT_USERS + '/:id/:entity/:entityId', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} },
    queryMemberships: { method: 'GET', isArray: true, params: { id: '@id', entity: 'memberships' } },
    queryTeams: { method: 'GET', isArray: true, params: { id: '@id', entity: 'teams' } },
    // RPCs should be moved to a specific endpoint
    checkPassword: { method: 'POST', params: { id: '@id', entity: 'passwd' } },
    checkAdminUser: { method: 'GET', params: { id: 'admin', entity: 'check' }, isArray: true },
    initAdminUser: { method: 'POST', params: { id: 'admin', entity: 'init' } }
  });
}]);
