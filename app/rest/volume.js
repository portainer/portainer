angular.module('portainer.rest')
.factory('Volume', ['$resource', 'Settings', function VolumeFactory($resource, Settings) {
  'use strict';
  return $resource(Settings.url + '/volumes/:name/:action', {name: '@name'}, {
    query: {method: 'GET'},
    get: {method: 'GET'},
    create: {method: 'POST', params: {action: 'create'}, transformResponse: genericHandler},
    remove: {
      method: 'DELETE', transformResponse: genericHandler
    }
  });
}]);
