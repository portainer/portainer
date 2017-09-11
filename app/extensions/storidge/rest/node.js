angular.module('extension.storidge')
.factory('StoridgeNodes', ['$http', 'EndpointProvider', function StoridgeNodesFactory($http, EndpointProvider) {
  'use strict';

  // var EndpointProvider.StoridgeAPI() = 'http://114.23.120.182:8282';

  var service = {};

  service.query = function() {
    return $http({
      method: 'GET',
      url: EndpointProvider.StoridgeAPI() + '/nodes',
      skipAuthorization: true
    });
  };

  service.inspect = function(id) {
    return $http({
      method: 'GET',
      url: EndpointProvider.StoridgeAPI() + '/nodes/' + id,
      skipAuthorization: true
    });
  };

  return service;
}]);
