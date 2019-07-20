import _ from 'lodash-es';
import { ExtensionViewModel } from '../../models/extension';

angular.module('portainer.app')
.factory('ExtensionService', ['$q', 'Extension', 'StateManager', '$async', function ExtensionServiceFactory($q, Extension, StateManager, $async) {
  'use strict';
  var service = {};

  service.EXTENSIONS = Object.freeze({
    REGISTRY_MANAGEMENT: 1,
    OAUTH_AUTHENTICATION: 2,
    RBAC: 3
  });

  service.enable = enable;
  service.update = update;
  service.delete = _delete;
  service.extensions = extensions;
  service.extension = extension;
  service.extensionEnabled = extensionEnabled;
  service.retrieveAndSaveEnabledExtensions = retrieveAndSaveEnabledExtensions;

  function enable(license) {
    return Extension.create({ license: license }).$promise;
  }

  function update(id, version) {
    return Extension.update({ id: id, version: version }).$promise;
  }

  function _delete(id) {
    return Extension.delete({ id: id }).$promise;
  }

  function extensions(store) {
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
  }

  function extension(id) {
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
  }

  function extensionEnabled(extensionId) {
    return $async(extensionsEnabledAsync, extensionId)
  }

  async function extensionsEnabledAsync(extensionId) {
    if (extensionId === service.EXTENSIONS.RBAC) {
      return StateManager.getExtension(extensionId) ? true : false;
    } else {
      const extensions = await service.extensions(false);
      const extension = _.find(extensions, (ext) => ext.Id === extensionId);
      return extension ? extension.Enabled : false;
    }
  }

  function retrieveAndSaveEnabledExtensions() {
    return $async(retrieveAndSaveEnabledExtensionsAsync)
  }

  async function retrieveAndSaveEnabledExtensionsAsync() {
    const extensions = await service.extensions(false);
    _.forEach(extensions, (ext) => delete ext.License);
    StateManager.saveExtensions(extensions);
  }

  return service;
}]);
