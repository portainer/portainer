angular.module('portainer.rest')
.factory('RegistryBlobs', ['$resource', 'API_ENDPOINT_REGISTRIES', function RegistryBlobsFactory($resource, API_ENDPOINT_REGISTRIES) {
  'use strict';
  return $resource(API_ENDPOINT_REGISTRIES + '/:id/v2/:repository/blobs/:reference', {}, {
    head: {
      method: 'HEAD',
      params: { id: '@id', repository: '@repository', reference: '@reference' },
      transformResponse: function(data, headers){
        var response = {};
        try {
          response.data = JSON.parse(data);
        } catch (e) {
          response.data = data;
        }
        response.headers = headers();
        return response;
      }
    }
  });
}]);
