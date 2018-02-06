angular.module('extension.storidge')
.factory('StoridgeNodes', ['$http', 'StoridgeManager', function StoridgeNodesFactory($http, StoridgeManager) {
  'use strict';

  var service = {};

  service.query = function() {
    return $http({
      method: 'GET',
      url: StoridgeManager.StoridgeAPIURL() + '/nodes',
      skipAuthorization: true
    });
  };

  service.inspect = function(id) {
    return $http({
      method: 'GET',
      url: StoridgeManager.StoridgeAPIURL() + '/nodes/' + id,
      skipAuthorization: true
    });
  };

  return service;
}]);
