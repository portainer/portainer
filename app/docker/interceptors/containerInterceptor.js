angular.module('portainer.app').factory('ContainerInterceptor', [
  '$rootScope',
  function ($rootScope) {
    'use strict';
    var interceptor = {};

    interceptor.response = responseInterceptor;

    function responseInterceptor(response) {
      if (response.status === 200) {
        $rootScope.currentPortainerId = response.headers('X-Portainer-ID');
      }
      return response.data;
    }
    return interceptor;
  },
]);
