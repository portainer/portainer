angular.module('portainer.app')
  .factory('LocalRegistryService', ['$q', 'RegistryCatalog', 'RegistryTags', 'RegistryManifests', 'LocalRegistryHelper',
    function LocalRegistryServiceFactory($q, RegistryCatalog, RegistryTags, RegistryManifests, LocalRegistryHelper) {
      'use strict';
      var service = {};

      service.repositories = function (id) {
        var deferred = $q.defer();

        RegistryCatalog.get({
            id: id
          }).$promise
          .then(function success(data) {
            var promises = [];
            for (var i = 0; i < data.repositories.length; i++) {
              var repository = data.repositories[i];
              promises.push(RegistryTags.get({
                id: id,
                repository: repository
              }).$promise);
            }
            return $q.all(promises);
          })
          .then(function success(data) {
            var repositories = data.map(function (item) {
              return new RegistryRepositoryViewModel(item);
            });
            deferred.resolve(repositories);
          })
          .catch(function error(err) {
            deferred.reject({
              msg: 'Unable to retrieve repositories',
              err: err
            });
          });

        return deferred.promise;
      };

      service.tags = function (id, repository) {
        var deferred = $q.defer();

        RegistryTags.get({
            id: id,
            repository: repository
          }).$promise
          .then(function succes(data) {
            deferred.resolve(data.tags);
          }).catch(function error(err) {
            deferred.reject({
              msg: 'Unable to retrieve tags',
              err: err
            });
          });

        return deferred.promise;
      };

      service.tag = function (id, repository, tag) {
        var deferred = $q.defer();

        var promises = {
          v1: RegistryManifests.get({
            id: id,
            repository: repository,
            tag: tag
          }).$promise,
          v2: RegistryManifests.getV2({
            id: id,
            repository: repository,
            tag: tag
          }).$promise
        };
        $q.all(promises)
          .then(function success(data) {
            var tag = LocalRegistryHelper.manifestsToTag(data);
            deferred.resolve(tag);
          }).catch(function error(err) {
            deferred.reject({
              msg: 'Unable to retrieve tag ' + tag,
              err: err
            });
          });

        return deferred.promise;
      };

      service.addTag = function (id, repository, tag, manifest) {
        delete manifest.digest;
        return RegistryManifests.put({
          id: id,
          repository: repository,
          tag: tag
        }, manifest).$promise;
      };

      service.deleteManifest = function (id, repository, digest) {
        return RegistryManifests.delete({
          id: id,
          repository: repository,
          tag: digest
        }).$promise;
      };

      return service;
    }
  ]);