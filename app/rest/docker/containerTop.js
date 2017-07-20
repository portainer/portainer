angular.module('portainer.rest')
.factory('ContainerTop', ['$http', 'ENDPOINTS_ENDPOINT', 'EndpointProvider', function ($http, ENDPOINTS_ENDPOINT, EndpointProvider) {
  'use strict';
  return {
    get: function (id, params, callback, errorCallback) {
      $http({
        method: 'GET',
        url: ENDPOINTS_ENDPOINT + '/' + EndpointProvider.endpointID() + '/containers/' + id + '/top',
        params: {
          ps_args: params.ps_args
        }
      }).success(callback);
    }
  };
}]);
