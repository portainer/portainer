angular.module('extension.storidge')
.factory('StoridgeProfileService', ['$q', 'StoridgeProfiles', function StoridgeProfileServiceFactory($q, StoridgeProfiles) {
  'use strict';
  var service = {};

  service.create = function(model) {
    var payload = new StoridgeCreateProfileRequest(model);
    return StoridgeProfiles.create(payload);
  };

  service.update = function(model) {
    var payload = new StoridgeCreateProfileRequest(model);
    return StoridgeProfiles.update(model.Name, payload);
  };

  service.delete = function(profileName) {
    return StoridgeProfiles.delete(profileName);
  };

  service.profile = function(profileName) {
    var deferred = $q.defer();

    StoridgeProfiles.inspect(profileName)
    .then(function success(response) {
      var profile = new StoridgeProfileModel(response.data);
      deferred.resolve(profile);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge profile details', err: err });
    });

    return deferred.promise;
  };

  service.profiles = function() {
    var deferred = $q.defer();

    StoridgeProfiles.query()
    .then(function success(response) {
      var profiles = response.data.profiles.map(function (item) {
        return new StoridgeProfileListModel(item);
      });
      deferred.resolve(profiles);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge profiles', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
