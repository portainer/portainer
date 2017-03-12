angular.module('portainer.rest')
.factory('Version', ['$resource', 'Settings', 'EndpointProvider', function VersionFactory($resource, Settings, EndpointProvider) {
    'use strict';
    return $resource(Settings.url + '/:endpointId/version', {
      endpointId: EndpointProvider.endpointID
    });
}]);
