angular.module('portainer.services')
.factory('ImageService', ['$q', 'Image', 'ImageHelper', function ImageServiceFactory($q, Image, ImageHelper) {
  'use strict';
  var service = {};

  service.image = function(imageId) {
    var deferred = $q.defer();
    Image.get({id: imageId}).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message });
      } else {
        var image = new ImageDetailsViewModel(data);
        deferred.resolve(image);
      }
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve image details', err: err });
    });
    return deferred.promise;
  };

  service.history = function(imageId) {
    var deferred = $q.defer();
    Image.history({id: imageId}).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message });
      } else {
        var layers = [];
        angular.forEach(data, function(imageLayer) {
          layers.push(new ImageLayerViewModel(imageLayer));
        });
        deferred.resolve(layers);
      }
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve image details', err: err });
    });
    return deferred.promise;
  };

  service.images = function() {
    var deferred = $q.defer();
    Image.query({}).$promise
    .then(function success(data) {
      var images = data.map(function (item) {
        return new ImageViewModel(item);
      });
      deferred.resolve(images);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve images', err: err });
    });
    return deferred.promise;
  };

  service.pullImage = function(image, registry) {
    var deferred = $q.defer();
    var imageConfiguration = ImageHelper.createImageConfigForContainer(image, registry);
    Image.create(imageConfiguration).$promise
    .then(function success(data) {
      var err = data.length > 0 && data[data.length - 1].hasOwnProperty('message');
      if (err) {
        var detail = data[data.length - 1];
        deferred.reject({ msg: detail.message });
      } else {
        deferred.resolve(data);
      }
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to pull image', err: err });
    });
    return deferred.promise;
  };

  service.pullTag = function(tag) {
    var imageAndRegistry = ImageHelper.extractImageAndRegistryFromTag(tag);
    return service.pullImage(imageAndRegistry.image, imageAndRegistry.registry);
  };

  service.tagImage = function(id, image, registry) {
    var imageConfig = ImageHelper.createImageConfigForCommit(image, registry);
    return Image.tag({id: id, tag: imageConfig.tag, repo: imageConfig.repo}).$promise;
  };

  service.deleteImage = function(id, forceRemoval) {
    var deferred = $q.defer();
    Image.remove({id: id, force: forceRemoval}).$promise
    .then(function success(data) {
      if (data[0].message) {
        deferred.reject({ msg: data[0].message });
      } else {
        deferred.resolve();
      }
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to remove image', err: err });
    });
    return deferred.promise;
  };

  service.pushImage = function(tag) {
    var deferred = $q.defer();
    Image.push({tag: tag}).$promise
    .then(function success(data) {
      if (data[data.length - 1].error) {
        deferred.reject({ msg: data[data.length - 1].error });
      } else {
        deferred.resolve();
      }
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to push image tag', err: err });
    });
    return deferred.promise;
  };

  return service;
}]);
