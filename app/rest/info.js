angular.module('portainer.rest')
.factory('Info', ['$resource', 'Settings', 'EndpointProvider', function InfoFactory($resource, Settings, EndpointProvider) {
  'use strict';
  return $resource(Settings.url + '/:endpointId/info', {
    endpointId: EndpointProvider.endpointID
  });
}]);
