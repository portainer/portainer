angular.module('portainer.rest')
.factory('Info', ['$resource', 'Settings', function InfoFactory($resource, Settings) {
  'use strict';
  return $resource(Settings.url + '/info', {});
}]);
