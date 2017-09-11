angular.module('extension.storidge')
.factory('StoridgeCluster', ['$http', function StoridgeClusterFactory($http) {
  'use strict';

  var API_URL = 'http://114.23.120.182:8282';

  var service = {};

  service.queryEvents = function() {
    return $http({
      method: 'GET',
      url: API_URL + '/events',
      skipAuthorization: true,
      timeout: 4500
    });
  };

  service.queryVersion = function() {
    return $http({
      method: 'GET',
      url: API_URL + '/version',
      skipAuthorization: true
    });
  };

  service.queryInfo = function() {
    return $http({
      method: 'GET',
      url: API_URL + '/info',
      skipAuthorization: true,
      timeout: 4500
    });
  };

  service.reboot = function() {
    return $http({
      method: 'POST',
      url: API_URL + '/cluster/reboot',
      skipAuthorization: true
    });
  };

  return service;
}]);
