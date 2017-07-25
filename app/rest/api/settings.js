angular.module('portainer.rest')
.factory('Settings', ['$resource', 'API_ENDPOINT_SETTINGS', function SettingsFactory($resource, API_ENDPOINT_SETTINGS) {
  'use strict';
  return $resource(API_ENDPOINT_SETTINGS, {}, {
    get: { method: 'GET' },
    update: { method: 'PUT' }
  });
}]);
