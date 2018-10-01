angular.module('portainer.app')
  .factory('VolumesInterceptor', ['$q', 'LocalStorage', function ($q, LocalStorage) {
    return {
      responseError: function (rejection) {

        if (rejection.status === 502 || rejection.status === -1) {
          var endpointId = LocalStorage.getEndpointID();
          var endpoints = LocalStorage.getEndpoints();
          var endpoint = _.find(endpoints, function (item) {
            return item.Id === endpointId;
          });
          if (endpoint !== undefined) {
            var data = endpoint.Snapshots[0].SnapshotRaw.Volumes;
            if (data !== undefined) {
              return data;
            }
          }
        }
        return $q.reject(rejection);
      }
    };
  }]);