angular.module('portainer.rest')
.factory('ContainerLogs', ['$http', 'DOCKER_ENDPOINT', 'EndpointProvider', function ContainerLogsFactory($http, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return {
    get: function (id, params, callback) {
      $http({
        method: 'GET',
        url: DOCKER_ENDPOINT + '/' + EndpointProvider.endpointID() + '/containers/' + id + '/logs',
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
