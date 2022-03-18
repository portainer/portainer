angular.module('portainer.app').factory('BackupService', [
  '$q',
  '$async',
  'Backup',
  'FileUploadService',
  function BackupServiceFactory($q, $async, Backup, FileUploadService) {
    'use strict';
    const service = {};

    service.downloadBackup = function (payload) {
      return Backup.download({}, payload).$promise;
    };

    service.uploadBackup = function (file, password) {
      return FileUploadService.uploadBackup(file, password);
    };

    service.getS3Settings = function () {
      var deferred = $q.defer();

      Backup.getS3Settings()
        .$promise.then(function success(data) {
          deferred.resolve(data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve backup S3 settings', err: err });
        });

      return deferred.promise;
    };

    service.saveS3Settings = function (payload) {
      var deferred = $q.defer();

      Backup.saveS3Settings({}, payload)
        .$promise.then(function success(data) {
          deferred.resolve(data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to save backup S3 settings', err: err });
        });

      return deferred.promise;
    };

    service.exportBackup = function (payload) {
      var deferred = $q.defer();

      Backup.exportS3Backup({}, payload)
        .$promise.then(function success(data) {
          deferred.resolve(data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to export backup', err: err });
        });

      return deferred.promise;
    };

    service.restoreFromS3 = function (payload) {
      var deferred = $q.defer();

      Backup.restoreS3Backup({}, payload)
        .$promise.then(function success(data) {
          deferred.resolve(data);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to restore backup from S3', err: err });
        });

      return deferred.promise;
    };

    return service;
  },
]);
