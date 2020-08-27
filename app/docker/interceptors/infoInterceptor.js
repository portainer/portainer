angular.module('portainer.app').factory('InfoInterceptor', [
  '$q',
  'EndpointProvider',
  function ($q, EndpointProvider) {
    'use strict';
    var interceptor = {};

    interceptor.responseError = responseErrorInterceptor;

    function responseErrorInterceptor(rejection) {
      if (rejection.status === 502 || rejection.status === 503 || rejection.status === -1) {
        var endpoint = EndpointProvider.currentEndpoint();
        if (endpoint !== undefined && endpoint.Snapshots.length && endpoint.Snapshots[0].SnapshotRaw) {
          var data = endpoint.Snapshots[0].SnapshotRaw.Info;
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
