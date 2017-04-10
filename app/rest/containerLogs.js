angular.module('portainer.rest')
.factory('ContainerLogs', ['$http', 'Settings', 'EndpointProvider', function ContainerLogsFactory($http, Settings, EndpointProvider) {
  'use strict';
  return {
    get: function (id, params, callback) {
      $http({
        method: 'GET',
        url: Settings.url + '/' + EndpointProvider.endpointID() + '/containers/' + id + '/logs',
        params: {
          'stdout': params.stdout || 0,
          'stderr': params.stderr || 0,
          'timestamps': params.timestamps || 0,
          'tail': params.tail || 'all'
        }
      }).success(callback).error(function (data, status, headers, config) {
        console.log(error, data);
      });
    }
  };
}]);
