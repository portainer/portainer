import _ from 'lodash-es';
import { ExtensionViewModel } from '../../models/extension';

angular.module('portainer.app').factory('ExtensionService', [
  '$q',
  'Extension',
  'StateManager',
  '$async',
  'FileUploadService',
  function ExtensionServiceFactory($q, Extension, StateManager, $async, FileUploadService) {
    'use strict';
    var service = {};

    service.EXTENSIONS = Object.freeze({
      REGISTRY_MANAGEMENT: 1,
      OAUTH_AUTHENTICATION: 2,
    });

    service.enable = enable;
    service.update = update;
    service.delete = _delete;
    service.extensions = extensions;
    service.extension = extension;
    service.extensionEnabled = extensionEnabled;
    service.retrieveAndSaveEnabledExtensions = retrieveAndSaveEnabledExtensions;

    function enable(license, extensionFile) {
      if (extensionFile) {
        return FileUploadService.uploadExtension(license, extensionFile);
      } else {
        return Extension.create({ license: license }).$promise;
      }
    }

    function update(id, version) {
      return Extension.update({ id: id, version: version }).$promise;
    }

    function _delete(id) {
      return Extension.delete({ id: id }).$promise;
    }

    function extensions(store) {
      var deferred = $q.defer();

      Extension.query({ store: store })
        .$promise.then(function success(data) {
          var extensions = data.map(function (item) {
            return new ExtensionViewModel(item);
          });
          deferred.resolve(extensions);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve extensions', err: err });
        });

      return deferred.promise;
    }

    function extension(id) {
      var deferred = $q.defer();

      Extension.get({ id: id })
        .$promise.then(function success(data) {
          var extension = new ExtensionViewModel(data);
          deferred.resolve(extension);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve extension details', err: err });
        });

      return deferred.promise;
    }

    function extensionEnabled(extensionId) {
      return $async(extensionsEnabledAsync, extensionId);
    }

    async function extensionsEnabledAsync(extensionId) {
      const extensions = await service.extensions(false);
      const extension = _.find(extensions, (ext) => ext.Id === extensionId);
      return extension ? extension.Enabled : false;
    }

    function retrieveAndSaveEnabledExtensions() {
      return $async(retrieveAndSaveEnabledExtensionsAsync);
    }

    async function retrieveAndSaveEnabledExtensionsAsync() {
      const extensions = await service.extensions(false);
      _.forEach(extensions, (ext) => delete ext.License);
      StateManager.saveExtensions(extensions);
    }

    return service;
  },
]);
