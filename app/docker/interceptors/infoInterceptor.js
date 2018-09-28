angular.module('portainer.app')
  .factory('InfoInterceptor', ['$q', '$rootScope', function ($q, $rootScope) {
    return {
      request: function (request) {
        console.log('info request');
        return request;
      },
      requestError: function (rejection) {
        console.log('info request error');
        return $q.reject(rejection);
      },
      response: function (response) {
        console.log('info response');
        return response.resource;
      },
      responseError: function (rejection) {
        console.log('info reponse error');

        if (rejection.status === 502) {
          if ($rootScope.endpoints !== undefined) {
            var endpointId = _.split(rejection.config.url, '/')[2];
            endpointId = parseInt(endpointId, 10);
            var endpoint = _.find($rootScope.endpoints, function (item) {
              return item.Id === endpointId;
            });
            var data = endpoint.Snapshots[0].SnapshotRaw.Info;
            if (endpoint !== undefined && data !== undefined) {
              return data;
            }
          }
        }
        return $q.reject(rejection);
      }
    };
  }]);