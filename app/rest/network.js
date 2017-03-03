angular.module('portainer.rest')
.factory('Network', ['$resource', 'Settings', function NetworkFactory($resource, Settings) {
  'use strict';
  return $resource(Settings.url + '/networks/:id/:action', {id: '@id'}, {
    query: {method: 'GET', isArray: true},
    get: {method: 'GET'},
    create: {method: 'POST', params: {action: 'create'}, transformResponse: genericHandler},
    remove: { method: 'DELETE', transformResponse: genericHandler },
    connect: {method: 'POST', params: {action: 'connect'}},
    disconnect: {method: 'POST', params: {action: 'disconnect'}}
  });
}]);
