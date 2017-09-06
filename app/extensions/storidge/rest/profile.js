angular.module('extension.storidge')
.factory('StoridgeProfiles', ['$http', function StoridgeProfilesFactory($http) {
  'use strict';

  var API_URL = 'http://114.23.120.182:8282';

  var service = {};

  service.create = function(payload) {
    return $http({
      method: 'POST',
      url: API_URL + '/profiles',
      data: payload,
      headers: { 'Content-type': 'application/json' },
      skipAuthorization: true
    });
  };

  service.update = function(id, payload) {
    return $http({
      method: 'PUT',
      url: API_URL + '/profiles/' + id,
      data: payload,
      headers: { 'Content-type': 'application/json' },
      skipAuthorization: true
    });
  };

  service.query = function() {
    return $http({
      method: 'GET',
      url: API_URL + '/profiles',
      skipAuthorization: true
    });
  };

  service.inspect = function(id) {
    return $http({
      method: 'GET',
      url: API_URL + '/profiles/' + id,
      skipAuthorization: true
    });
  };

  service.delete = function(id) {
    return $http({
      method: 'DELETE',
      url: API_URL + '/profiles/' + id,
      skipAuthorization: true
    });
  };

  return service;
}]);
