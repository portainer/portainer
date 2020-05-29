angular.module('portainer.app').factory('VolumesInterceptor', [
  '$q',
  'EndpointProvider',
  function ($q, EndpointProvider) {
    'use strict';
    var interceptor = {};

    interceptor.responseError = responseErrorInterceptor;

    function responseErrorInterceptor(rejection) {
      if (rejection.status === 502 || rejection.status === 503 || rejection.status === -1) {
        var endpoint = EndpointProvider.currentEndpoint();
        if (endpoint !== undefined) {
          var data = endpoint.Snapshots[0].SnapshotRaw.Volumes;
          if (data !== undefined) {
            return data;
          }
        }
      }
      return $q.reject(rejection);
    }
    return interceptor;
  },
]);
