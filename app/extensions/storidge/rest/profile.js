angular.module('extension.storidge')
.factory('StoridgeProfiles', ['$http', 'StoridgeManager', function StoridgeProfilesFactory($http, StoridgeManager) {
  'use strict';

  var service = {};

  service.create = function(payload) {
    return $http({
      method: 'POST',
      url: StoridgeManager.StoridgeAPIURL() + '/profiles',
      data: payload,
      headers: { 'Content-type': 'application/json' },
      skipAuthorization: true
    });
  };

  service.update = function(id, payload) {
    return $http({
      method: 'PUT',
      url: StoridgeManager.StoridgeAPIURL() + '/profiles/' + id,
      data: payload,
      headers: { 'Content-type': 'application/json' },
      skipAuthorization: true
    });
  };

  service.query = function() {
    return $http({
      method: 'GET',
      url: StoridgeManager.StoridgeAPIURL() + '/profiles',
      skipAuthorization: true
    });
  };

  service.inspect = function(id) {
    return $http({
      method: 'GET',
      url: StoridgeManager.StoridgeAPIURL() + '/profiles/' + id,
      skipAuthorization: true
    });
  };

  service.delete = function(id) {
    return $http({
      method: 'DELETE',
      url: StoridgeManager.StoridgeAPIURL() + '/profiles/' + id,
      skipAuthorization: true
    });
  };

  return service;
}]);
