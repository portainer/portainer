angular.module('portainer.rest')
.factory('RegistryManifests', ['$resource', 'API_ENDPOINT_REGISTRIES', function RegistryManifestsFactory($resource, API_ENDPOINT_REGISTRIES) {
  'use strict';
  return $resource(API_ENDPOINT_REGISTRIES + '/:id/v2/:repository/manifests/:tag', {}, {
    get: { method: 'GET', params: { id: '@id', repository: '@repository', tag: '@tag' } }
  });
}]);
