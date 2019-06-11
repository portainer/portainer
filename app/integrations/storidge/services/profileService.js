import {
  StoridgeCreateProfileRequest,
  StoridgeProfileListModel,
  StoridgeProfileModel
} from '../models/profile';

angular.module('portainer.integrations.storidge')
.factory('StoridgeProfileService', ['$q', 'Storidge', function StoridgeProfileServiceFactory($q, Storidge) {
  'use strict';
  var service = {};

  service.create = function(model) {
    var payload = new StoridgeCreateProfileRequest(model);
    return Storidge.createProfile(payload).$promise;
  };

  service.update = function(model) {
    var payload = new StoridgeCreateProfileRequest(model);
    return Storidge.updateProfile(payload).$promise;
  };

  service.delete = function(profileName) {
    return Storidge.deleteProfile({ id: profileName }).$promise;
  };

  service.profile = function(profileName) {
    var deferred = $q.defer();

    Storidge.getProfile({ id: profileName }).$promise
    .then(function success(data) {
      var profile = new StoridgeProfileModel(profileName, data);
      deferred.resolve(profile);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge profile details', err: err });
    });

    return deferred.promise;
  };

  service.profiles = function() {
    var deferred = $q.defer();

    Storidge.queryProfiles().$promise
    .then(function success(data) {
      var profiles = data.profiles.map(function (item) {
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
