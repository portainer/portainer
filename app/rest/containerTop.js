angular.module('portainer.rest')
.factory('ContainerTop', ['$http', 'Settings', 'EndpointProvider', function ($http, Settings, EndpointProvider) {
  'use strict';
  return {
    get: function (id, params, callback, errorCallback) {
      $http({
        method: 'GET',
        url: Settings.url + '/' + EndpointProvider.endpointID() + '/containers/' + id + '/top',
        params: {
          ps_args: params.ps_args
        }
      }).success(callback);
    }
  };
}]);
