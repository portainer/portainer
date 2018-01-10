angular.module('portainer.rest')
.factory('RegistryCatalog', ['$resource', 'API_ENDPOINT_REGISTRIES', function RegistryCatalogFactory($resource, API_ENDPOINT_REGISTRIES) {
  'use strict';
  return $resource(API_ENDPOINT_REGISTRIES + '/:id/v2/_catalog?n=:limit&last=:last', {}, {
    get: {
      method: 'GET',
      params: { id: '@id', limit: '@limit', last: '@last' },
      transformResponse: function(data, headers){
        var response = {}
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
