angular.module('portainer.rest')
.factory('ContainerTop', ['$http', 'Settings', function ($http, Settings) {
  'use strict';
  return {
    get: function (id, params, callback, errorCallback) {
      $http({
        method: 'GET',
        url: Settings.url + '/containers/' + id + '/top',
        params: {
          ps_args: params.ps_args
        }
      }).success(callback);
    }
  };
}]);
