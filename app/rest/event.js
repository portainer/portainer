angular.module('portainer.rest')
.factory('Events', ['$resource', 'Settings', function EventFactory($resource, Settings) {
  'use strict';
  return $resource(Settings.url + '/events', {}, {
    query: {
      method: 'GET', params: {since: '@since', until: '@until'},
      isArray: true, transformResponse: jsonObjectsToArrayHandler
    }
  });
}]);
