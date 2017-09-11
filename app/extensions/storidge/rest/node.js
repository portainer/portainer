angular.module('extension.storidge')
.factory('StoridgeNodes', ['$http', function StoridgeNodesFactory($http) {
  'use strict';

  var API_URL = 'http://114.23.120.182:8282';

  var service = {};

  service.query = function() {
    return $http({
      method: 'GET',
      url: API_URL + '/nodes',
      skipAuthorization: true
    });
  };

  service.inspect = function(id) {
    return $http({
      method: 'GET',
      url: API_URL + '/nodes/' + id,
      skipAuthorization: true
    });
  };

  return service;
}]);
