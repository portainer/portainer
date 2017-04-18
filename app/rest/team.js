angular.module('portainer.rest')
.factory('Teams', ['$resource', 'TEAMS_ENDPOINT', function TeamsFactory($resource, TEAMS_ENDPOINT) {
  'use strict';
  return $resource(TEAMS_ENDPOINT + '/:id/:action', {}, {
    query: { method: 'GET', isArray: true },
  });
}]);
