angular.module('portainer.extensions.registrymanagement')
.factory('RegistryManifests', ['$resource', 'API_ENDPOINT_REGISTRIES', function RegistryManifestsFactory($resource, API_ENDPOINT_REGISTRIES) {
  'use strict';
  return $resource(API_ENDPOINT_REGISTRIES + '/:id/v2/:repository/manifests/:tag', {}, {
    get: {
      method: 'GET',
      params: {
        id: '@id',
        repository: '@repository',
        tag: '@tag'
      },
      headers: {
        'Cache-Control': 'no-cache'
      },
      ignoreLoadingBar: true
    },
    getV2: {
      method: 'GET',
      params: {
        id: '@id',
        repository: '@repository',
        tag: '@tag'
      },
      headers: {
        'Accept': 'application/vnd.docker.distribution.manifest.v2+json',
        'Cache-Control': 'no-cache'
      },
      ignoreLoadingBar: true
    },
    put: {
      method: 'PUT',
      params: {
        id: '@id',
        repository: '@repository',
        tag: '@tag'
      },
      headers: {
        'Content-Type': 'application/vnd.docker.distribution.manifest.v2+json'
      },
      transformRequest: function (data) {
        return angular.toJson(data, 3);
      }
    },
    delete: {
      method: 'DELETE',
      params: {
        id: '@id',
        repository: '@repository',
        tag: '@tag'
      }
    }
  });
}]);
