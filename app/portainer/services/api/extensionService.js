angular.module('portainer.app')
.factory('ExtensionService', ['$q', 'Extension', function ExtensionServiceFactory($q, Extension) {
  'use strict';
  var service = {};

  service.enable = function(license) {
    return Extension.create({ license: license }).$promise;
  };

  service.update = function(id, version) {
    return Extension.update({ id: id, version: version }).$promise;
  };

  service.delete = function(id) {
    return Extension.delete({ id: id }).$promise;
  };

  service.extensions = function(store) {
    var deferred = $q.defer();

    Extension.query({ store: store }).$promise
    .then(function success(data) {
      var extensions = data.map(function (item) {
        return new ExtensionViewModel(item);
      });
      deferred.resolve(extensions);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve extensions', err: err});
    });

    return deferred.promise;
  };

  service.extension = function(id) {
    var deferred = $q.defer();

    Extension.get({ id: id }).$promise
    .then(function success(data) {
      var extension = new ExtensionViewModel(data);
      deferred.resolve(extension);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve extension details', err: err});
    });

    return deferred.promise;
  };

  service.registryManagementEnabled = function() {
    var deferred = $q.defer();

    service.extensions(false)
    .then(function onSuccess(extensions) {
      var extensionAvailable = _.find(extensions, { Id: 1, Enabled: true }) ? true : false;
      deferred.resolve(extensionAvailable);
    })
    .catch(function onError(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  service.OAuthAuthenticationEnabled = function() {
    var deferred = $q.defer();

    service.extensions(false)
    .then(function onSuccess(extensions) {
      var extensionAvailable = _.find(extensions, { Id: 2, Enabled: true }) ? true : false;
      deferred.resolve(extensionAvailable);
    })
    .catch(function onError(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  return service;
}]);
