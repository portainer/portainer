angular.module('extension.storidge')
.factory('StoridgeCluster', ['$http', 'StoridgeManager', function StoridgeClusterFactory($http, StoridgeManager) {
  'use strict';

  var service = {};

  service.queryEvents = function() {
    return $http({
      method: 'GET',
      url: StoridgeManager.StoridgeAPIURL() + '/events',
      skipAuthorization: true,
      timeout: 4500,
      ignoreLoadingBar: true
    });
  };

  service.queryVersion = function() {
    return $http({
      method: 'GET',
      url: StoridgeManager.StoridgeAPIURL() + '/version',
      skipAuthorization: true
    });
  };

  service.queryInfo = function() {
    return $http({
      method: 'GET',
      url: StoridgeManager.StoridgeAPIURL() + '/info',
      skipAuthorization: true,
      timeout: 4500,
      ignoreLoadingBar: true
    });
  };

  service.reboot = function() {
    return $http({
      method: 'POST',
      url: StoridgeManager.StoridgeAPIURL() + '/cluster/reboot',
      skipAuthorization: true
    });
  };

  service.shutdown = function() {
    return $http({
      method: 'POST',
      url: StoridgeManager.StoridgeAPIURL() + '/cluster/shutdown',
      skipAuthorization: true
    });
  };

  return service;
}]);
