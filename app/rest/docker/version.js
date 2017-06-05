angular.module('portainer.rest')
.factory('Version', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function VersionFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
    'use strict';
    return $resource(DOCKER_ENDPOINT + '/:endpointId/version', {
      endpointId: EndpointProvider.endpointID
    });
}]);
