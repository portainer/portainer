angular.module('portainer.app')
  .factory('VolumesInterceptor', ['$q', '$rootScope', function ($q, $rootScope) {
    return {
      request: function (request) {
        console.log('volumes request');
        return request;
      },
      requestError: function (rejection) {
        console.log('volumes request error');
        return $q.reject(rejection);
      },
      response: function (response) {
        console.log('volumes response');
        return response.resource;
      },
      responseError: function (rejection) {
        console.log('volumes reponse error');
        
        if (rejection.status === 502) {
          if ($rootScope.endpoints !== undefined) {
            var endpointId = _.split(rejection.config.url, '/')[2];
            endpointId = parseInt(endpointId, 10);
            var endpoint = _.find($rootScope.endpoints, function (item) {
              return item.Id === endpointId;
            });
            var data = endpoint.Snapshots[0].SnapshotRaw.Volumes;
            if (endpoint !== undefined && data !== undefined) {
              rejection.status = 200;
              rejection.data = data;
              console.log(rejection); return data;
            }
          }
        }
        return $q.reject(rejection);
      }
    };
  }]);