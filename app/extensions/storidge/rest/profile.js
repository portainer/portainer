angular.module('extension.storidge')
.factory('StoridgeProfiles', ['$http', 'EndpointProvider', function StoridgeProfilesFactory($http, EndpointProvider) {
  'use strict';

  // var EndpointProvider.StoridgeAPI() = 'http://114.23.120.182:8282';

  var service = {};

  service.create = function(payload) {
    return $http({
      method: 'POST',
      url: EndpointProvider.StoridgeAPI() + '/profiles',
      data: payload,
      headers: { 'Content-type': 'application/json' },
      skipAuthorization: true
    });
  };

  service.update = function(id, payload) {
    return $http({
      method: 'PUT',
      url: EndpointProvider.StoridgeAPI() + '/profiles/' + id,
      data: payload,
      headers: { 'Content-type': 'application/json' },
      skipAuthorization: true
    });
  };

  service.query = function() {
    return $http({
      method: 'GET',
      url: EndpointProvider.StoridgeAPI() + '/profiles',
      skipAuthorization: true
    });
  };

  service.inspect = function(id) {
    return $http({
      method: 'GET',
      url: EndpointProvider.StoridgeAPI() + '/profiles/' + id,
      skipAuthorization: true
    });
  };

  service.delete = function(id) {
    return $http({
      method: 'DELETE',
      url: EndpointProvider.StoridgeAPI() + '/profiles/' + id,
      skipAuthorization: true
    });
  };

  return service;
}]);
