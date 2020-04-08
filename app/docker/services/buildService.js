import { ImageBuildModel } from '../models/image';

angular.module('portainer.docker').factory('BuildService', [
  '$q',
  'Build',
  'FileUploadService',
  function BuildServiceFactory($q, Build, FileUploadService) {
    'use strict';
    var service = {};

    service.buildImageFromUpload = function (names, file, path) {
      var deferred = $q.defer();

      FileUploadService.buildImage(names, file, path)
        .then(function success(response) {
          var model = new ImageBuildModel(response.data);
          deferred.resolve(model);
        })
        .catch(function error(err) {
          deferred.reject(err);
        });

      return deferred.promise;
    };

    service.buildImageFromURL = function (names, url, path) {
      var params = {
        t: names,
        remote: url,
        dockerfile: path,
      };

      var deferred = $q.defer();

      Build.buildImage(params, {})
        .$promise.then(function success(data) {
          var model = new ImageBuildModel(data);
          deferred.resolve(model);
        })
        .catch(function error(err) {
          deferred.reject(err);
        });

      return deferred.promise;
    };

    service.buildImageFromDockerfileContent = function (names, content) {
      var params = {
        t: names,
      };
      var payload = {
        content: content,
      };

      var deferred = $q.defer();

      Build.buildImageOverride(params, payload)
        .$promise.then(function success(data) {
          var model = new ImageBuildModel(data);
          deferred.resolve(model);
        })
        .catch(function error(err) {
          deferred.reject(err);
        });

      return deferred.promise;
    };

    return service;
  },
]);
