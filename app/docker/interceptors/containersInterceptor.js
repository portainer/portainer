angular.module('portainer.app')
  .factory('ContainersInterceptor', ['$q', '$rootScope', function ($q, $rootScope) {
    return {
      request: function (request) {
        console.log('containers request');
        return request;
      },
      requestError: function (rejection) {
        console.log('containers request error');
        return $q.reject(rejection);
      },
      response: function (response) {
        console.log('containers response');
        return response.resource;
      },
      responseError: function (rejection) {
        console.log('containers reponse error');

        if (rejection.status === 502) {
          if ($rootScope.endpoints !== undefined) {
            var endpointId = _.split(rejection.config.url, '/')[2];
            endpointId = parseInt(endpointId, 10);
            var endpoint = _.find($rootScope.endpoints, function (item) {
              return item.Id === endpointId;
            });
            var data = endpoint.Snapshots[0].SnapshotRaw.Containers;
            if (endpoint !== undefined && data !== undefined) {
              rejection.status = 200;
              rejection.data = data;
              console.log(rejection);
              return data;
            }
          }
        }
        return $q.reject(rejection);
      }
    };
  }]);