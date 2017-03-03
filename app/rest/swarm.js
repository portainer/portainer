angular.module('portainer.rest')
.factory('Swarm', ['$resource', 'Settings', function SwarmFactory($resource, Settings) {
  'use strict';
  return $resource(Settings.url + '/swarm', {}, {
    get: {method: 'GET'}
  });
}]);
