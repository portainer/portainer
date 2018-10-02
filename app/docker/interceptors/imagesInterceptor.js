angular.module('portainer.app')
  .factory('ImagesInterceptor', ['$q', 'EndpointProvider', 'StateManager', function ($q, EndpointProvider, StateManager) {
    return {
      responseError: function (rejection) {
        if (rejection.status === 502 || rejection.status === -1) {
          var endpoint = EndpointProvider.currentEndpoint();
          if (endpoint !== undefined) {
            var data = endpoint.Snapshots[0].SnapshotRaw.Images;
            if (data !== undefined) {
              if (StateManager.getState().endpoint.status === 1) {
                StateManager.setEndpointStatus(2);
              }
              return data;
            }
          }
        }
        return $q.reject(rejection);
      }
    };
  }]);