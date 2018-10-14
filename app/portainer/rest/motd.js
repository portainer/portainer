import angular from 'angular';

angular.module('portainer.app')
.factory('Motd', ['$resource', 'API_ENDPOINT_MOTD', function MotdFactory($resource, API_ENDPOINT_MOTD) {
  'use strict';
  return $resource(API_ENDPOINT_MOTD, {}, {
    get: {
      method: 'GET',
      ignoreLoadingBar: true
    }
  });
}]);
