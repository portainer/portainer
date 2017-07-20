angular.module('portainer.rest')
.factory('ServiceLogs', ['$http', 'ENDPOINTS_ENDPOINT', 'EndpointProvider', function ServiceLogsFactory($http, ENDPOINTS_ENDPOINT, EndpointProvider) {
  'use strict';
  return {
    get: function (id, params, callback) {
      $http({
        method: 'GET',
        url: ENDPOINTS_ENDPOINT + '/' + EndpointProvider.endpointID() + '/services/' + id + '/logs',
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
