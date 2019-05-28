import _ from 'lodash-es';
import { ExtensionViewModel } from '../../models/extension';

angular.module('portainer.app')
.factory('ExtensionService', ['$q', 'Extension', 'StateManager', function ExtensionServiceFactory($q, Extension, StateManager) {
  'use strict';
  var service = {};

  service.EXTENSIONS = Object.freeze({
    REGISTRY_MANAGEMENT: 1,
    OAUTH_AUTHENTICATION: 2,
    RBAC: 3
  });

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

  service.extensionEnabled = async function(extensionId) {
    if (extensionId === service.EXTENSIONS.RBAC) {
      return StateManager.getExtension(extensionId) ? true : false;
    } else {
      const extension = await Extension.get({id: extensionId}).$promise;
      return extension.Enabled;
    }
  };

  service.retrieveAndSaveEnabledExtensions = async function() {
    const extensions = await service.extensions(false);
    _.forEach(extensions, (ext) => delete ext.License);
    StateManager.saveExtensions(extensions);
  };

  return service;
}]);
