angular.module('portainer.rest')
.factory('Version', ['$resource', 'Settings', function VersionFactory($resource, Settings) {
    'use strict';
    return $resource(Settings.url + '/version', {});
}]);
