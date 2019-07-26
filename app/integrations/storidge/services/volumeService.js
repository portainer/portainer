import { StoridgeVolumeModel, StoridgeVolumeUpdateModel } from '../models/volume';

angular.module('portainer.integrations.storidge')
.factory('StoridgeVolumeService', ['$q', 'Storidge', function StoridgeVolumeServiceFactory($q, Storidge) {
  'use strict';
  var service = {};

  service.volume = function(id) {
    var deferred = $q.defer();

    Storidge.getVolume({id:id}).$promise
    .then(function success(data) {
      var volume = new StoridgeVolumeModel(data);
      deferred.resolve(volume);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge volume', err: err });
    });

    return deferred.promise;
  };
  
  service.update = function(data) {
    var deferred = $q.defer();
    var volume = new StoridgeVolumeUpdateModel(data);
    Storidge.updateVolume(volume).$promise
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to update Storidge volume', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
