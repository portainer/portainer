angular.module('portainer.app')
.factory('Sshkeys', ['$resource', 'API_ENDPOINT_SSHKEYS', function SshkeysFactory($resource, API_ENDPOINT_SSHKEYS) {
  'use strict';
  return $resource(API_ENDPOINT_SSHKEYS + '/:id/:entity/:entityId', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
