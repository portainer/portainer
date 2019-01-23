angular.module('portainer.app')
  .factory('RegistryAPILinkInterceptor', [function () {
    'use strict';
    var interceptor = {};

    interceptor.response = responseInterceptor;

    function responseInterceptor(response) {
      var instance = response.data;
      var link = response.headers('link');
      if (link) {
        var queryString = link.substring(link.indexOf('?') + 1).split('>;')[0];
        var queries = queryString.split('&');
        for (var i = 0; i < queries.length; i++) {
            var kv = queries[i].split('=');
            instance[kv[0]] = kv[1];
        }
      }
      return instance;
    }

    return interceptor;
  }]);