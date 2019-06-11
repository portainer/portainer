import { StoridgeDriveModel } from '../models/drive';

angular.module('portainer.integrations.storidge')
.factory('StoridgeDriveService', ['$q', 'Storidge', function StoridgeDriveServiceFactory($q, Storidge) {
  'use strict';
  var service = {};

  service.drives = function () {
    var deferred = $q.defer();

    Storidge.queryDrives().$promise
    .then(function success(data) {
      var driveData = data.drives;
      var drives = driveData.map(function (drive) {
        return new StoridgeDriveModel(drive);
      });

      deferred.resolve(drives);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge drives', err: err });
    });

    return deferred.promise;
  };

  service.drive = function (id) {
    var deferred = $q.defer();
    
    Storidge.getDrive({ id: id }).$promise
    .then(function success(data) {
      var drive = new StoridgeDriveModel(data);
      Storidge.getNode({ id: data.nodeid }).$promise
      .then(function (data) {
        drive.Node = data.name;
        deferred.resolve(drive);
      });
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve Storidge drive', err: err });
    });

    return deferred.promise;
  };

  service.add = function (device, node) {
    var deferred = $q.defer();

    Storidge.addDrive({ device: device, node: node }).$promise
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to add Storidge drive', err: err });
    });

    return deferred.promise;
  };

  service.remove = function (id) {
    var deferred = $q.defer();

    Storidge.removeDrive({ id: id }).$promise
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to remove Storidge drive', err: err });
    });

    return deferred.promise;
  };

  service.rescan = function () {
    return Storidge.rescanDrives().$promise;
  };

  return service;
}]);
