angular.module('portainer.rest')
.factory('ContainerTop', ['$http', 'DOCKER_ENDPOINT', 'EndpointProvider', function ($http, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return {
    get: function (id, params, callback, errorCallback) {
      $http({
        method: 'GET',
        url: DOCKER_ENDPOINT + '/' + EndpointProvider.endpointID() + '/containers/' + id + '/top',
        params: {
          ps_args: params.ps_args
        }
      }).success(callback);
    }
  };
}]);
