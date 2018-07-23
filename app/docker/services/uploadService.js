angular.module('portainer.docker')
.factory('UploadService', ['$q', 'FileUploadService', function BuildServiceFactory($q, FileUploadService) {
  'use strict';
  var service = {};

  service.uploadImage = function(file) {
    var deferred = $q.defer();
    FileUploadService.loadImages(file)
    .then(function success(response) {
      var model = new ImageBuildModel(response.data);
      deferred.resolve(model);
    })
    .catch(function error(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  return service;
}]);
