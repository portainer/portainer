angular.module('extension.storidge')
.factory('StoridgeClusterService', ['$q', 'StoridgeCluster', function StoridgeClusterServiceFactory($q, StoridgeCluster) {
  'use strict';
  var service = {};

  service.reboot = function() {
    return StoridgeCluster.reboot();
  };

  service.shutdown = function() {
    return StoridgeCluster.shutdown();
  };

  service.info = function() {
    var deferred = $q.defer();

    StoridgeCluster.queryInfo()
    .then(function success(response) {
      var info = new StoridgeInfoModel(response.data);
      deferred.resolve(info);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge information', err: err });
    });

    return deferred.promise;
  };

  service.version = function() {
    var deferred = $q.defer();

    StoridgeCluster.queryVersion()
    .then(function success(response) {
      var version = response.data.version;
      deferred.resolve(version);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge version', err: err });
    });

    return deferred.promise;
  };

  service.events = function() {
    var deferred = $q.defer();

    StoridgeCluster.queryEvents()
    .then(function success(response) {
      var events = response.data.map(function(item) {
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
