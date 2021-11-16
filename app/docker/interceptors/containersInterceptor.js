angular.module('portainer.app').factory('ContainersInterceptor', [
  '$rootScope',
  '$q',
  'EndpointProvider',
  function ($rootScope, $q, EndpointProvider) {
    'use strict';
    var interceptor = {};

    interceptor.responseError = responseErrorInterceptor;
    interceptor.response = responseInterceptor;

    function responseInterceptor(response) {
      if (response.status === 200) {
        $rootScope.currentPortainerId = response.headers('X-Portainer-ID');
      }
      return response.data;
    }
    function responseErrorInterceptor(rejection) {
      if (rejection.status === 502 || rejection.status === 503 || rejection.status === -1) {
        var endpoint = EndpointProvider.currentEndpoint();
        if (endpoint !== undefined) {
          var data = endpoint.Snapshots[0].SnapshotRaw.Containers;
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
