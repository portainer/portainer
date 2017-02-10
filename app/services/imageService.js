angular.module('portainer.services')
.factory('ImageService', ['$q', 'Image', function ImageServiceFactory($q, Image) {
  'use strict';
  var service = {};

  service.pullImage = function(imageConfiguration) {
    var deferred = $q.defer();
    Image.create(imageConfiguration).$promise
    .then(function success(data) {
      var err = data.length > 0 && data[data.length - 1].hasOwnProperty('error');
      if (err) {
        var detail = data[data.length - 1];
        deferred.reject({ msg: detail.error });
      } else {
        deferred.resolve(data);
      }
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to pull image', err: err });
    });
    return deferred.promise;
  };
  return service;
}]);
