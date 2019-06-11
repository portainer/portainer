import { StoridgeInfoModel } from '../models/info';
import { StoridgeEventModel } from '../models/events';

angular.module('portainer.integrations.storidge')
.factory('StoridgeClusterService', ['$q', 'Storidge', function StoridgeClusterServiceFactory($q, Storidge) {
  'use strict';
  var service = {};

  service.reboot = function() {
    return Storidge.rebootCluster().$promise;
  };

  service.shutdown = function() {
    return Storidge.shutdownCluster().$promise;
  };

  service.info = function() {
    var deferred = $q.defer();

    Storidge.getInfo().$promise
    .then(function success(data) {
      var info = new StoridgeInfoModel(data);
      deferred.resolve(info);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge information', err: err });
    });

    return deferred.promise;
  };

  service.version = function() {
    var deferred = $q.defer();

    Storidge.getVersion().$promise
    .then(function success(data) {
      var version = data.version;
      deferred.resolve(version);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge version', err: err });
    });

    return deferred.promise;
  };

  service.events = function() {
    var deferred = $q.defer();

    Storidge.queryEvents().$promise
    .then(function success(data) {
      var events = data.map(function(item) {
        return new StoridgeEventModel(item);
      });
      deferred.resolve(events);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge events', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
