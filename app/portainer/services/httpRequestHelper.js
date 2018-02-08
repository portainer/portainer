angular.module('portainer.app')
.factory('HttpRequestHelper', [function HttpRequestHelper() {
  'use strict';

  var service = {};
  var headers = {};

  service.registryAuthenticationHeader = function() {
    return headers.registryAuthentication;
  };

  service.setRegistryAuthenticationHeader = function(headerValue) {
    headers.registryAuthentication = headerValue;
  };

  return service;
}]);
