angular.module('portainer.rest')
.factory('Users', ['$resource', 'USERS_ENDPOINT', function UsersFactory($resource, USERS_ENDPOINT) {
  'use strict';
  return $resource(USERS_ENDPOINT + '/:username/:action', {}, {
    create: { method: 'POST' },
    get: { method: 'GET', params: { username: '@username' } },
    update: { method: 'PUT', params: { username: '@username' } },
    checkPassword: { method: 'POST', params: { username: '@username', action: 'passwd' } },
    checkAdminUser: { method: 'GET', params: { username: 'admin', action: 'check' } },
    initAdminUser: { method: 'POST', params: { username: 'admin', action: 'init' } }
  });
}]);
