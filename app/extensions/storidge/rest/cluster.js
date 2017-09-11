angular.module('extension.storidge')
.factory('StoridgeCluster', ['$http', 'EndpointProvider', function StoridgeClusterFactory($http, EndpointProvider) {
  'use strict';

  // var EndpointProvider.StoridgeAPI() = 'http://114.23.120.182:8282';

  var service = {};

  service.queryEvents = function() {
    return $http({
      method: 'GET',
      url: EndpointProvider.StoridgeAPI() + '/events',
      skipAuthorization: true,
      timeout: 4500
    });
  };

  service.queryVersion = function() {
    return $http({
      method: 'GET',
      url: EndpointProvider.StoridgeAPI() + '/version',
      skipAuthorization: true
    });
  };

  service.queryInfo = function() {
    return $http({
      method: 'GET',
      url: EndpointProvider.StoridgeAPI() + '/info',
      skipAuthorization: true,
      timeout: 4500
    });
  };

  service.reboot = function() {
    return $http({
      method: 'POST',
      url: EndpointProvider.StoridgeAPI() + '/cluster/reboot',
      skipAuthorization: true
    });
  };

  return service;
}]);
