angular.module('portainer.rest')
.factory('Settings', ['$resource', 'SETTINGS_ENDPOINT', function SettingsFactory($resource, SETTINGS_ENDPOINT) {
  'use strict';
  return $resource(SETTINGS_ENDPOINT, {}, {
    get: { method: 'GET' },
    update: { method: 'PUT' }
  });
}]);
