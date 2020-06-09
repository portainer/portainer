angular.module('portainer.azure').factory('Azure', [
  '$http',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function AzureFactory($http, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';

    var service = {};

    service.delete = function (id, apiVersion) {
      var url = API_ENDPOINT_ENDPOINTS + '/' + EndpointProvider.endpointID() + '/azure' + id + '?api-version=' + apiVersion;
      return $http({
        method: 'DELETE',
        url: url,
      });
    };

    return service;
  },
]);
