angular.module('portainer.rest')
.factory('ContainerTop', ['$http', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function ($http, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return {
    get: function (id, params, callback, errorCallback) {
      $http({
        method: 'GET',
        url: API_ENDPOINT_ENDPOINTS + '/' + EndpointProvider.endpointID() + '/containers/' + id + '/top',
        params: {
          ps_args: params.ps_args
        }
      }).success(callback);
    }
  };
}]);
