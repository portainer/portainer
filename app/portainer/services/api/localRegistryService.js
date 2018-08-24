angular.module('portainer.app')
  .factory('LocalRegistryService', ['$q', 'RegistryCatalog', 'RegistryTags', 'RegistryManifests', 'LocalRegistryHelper',
    function LocalRegistryServiceFactory($q, RegistryCatalog, RegistryTags, RegistryManifests, LocalRegistryHelper) {
      'use strict';
      var service = {};

      function manifestPromise(id, repository, tag) {
        var deferred = $q.defer();

        var promises = [RegistryManifests.get({
            id: id,
            repository: repository.name,
            tag: tag
          }).$promise,
          RegistryManifests.getV2({
            id: id,
            repository: repository.name,
            tag: tag
          }).$promise
        ];

        $q.all(promises)
          .then(function success(data) {
            var basicInfo = _.find(data, function (item) {
              return item.schemaVersion === 1;
            });
            var details = _.find(data, function (item) {
              return item.schemaVersion === 2;
            });
            deferred.resolve({
              basicInfo: basicInfo,
              details: details
            });
          }).catch(function error() {
            deferred.reject();
          });

        return deferred.promise;
      }

      service.images = function (id) {
        var deferred = $q.defer();

        RegistryCatalog.get({
            id: id
          }).$promise
          .then(function success(data) {
            var repositories = data.repositories;
            var tagsPromises = [];
            for (var i = 0; i < repositories.length; i++) {
              var repository = repositories[i];
              var promise = RegistryTags.get({
                id: id,
                repository: repository
              }).$promise;
              tagsPromises.push(promise);
            }
            return $q.all(tagsPromises);
          }).then(function success(data) {
            var manifestsPromises = [];
            for (var i = 0; i < data.length; i++) {
              var repository = data[i];
              if (repository.tags) {
                for (var j = 0; j < repository.tags.length; j++) {
                  var tag = repository.tags[j];
                  var promise = manifestPromise(id, repository, tag);
                  manifestsPromises.push(promise);
                }
              }
            }
            return $q.all(manifestsPromises);
          })
          .then(function success(data) {
            var manifests = data.map(function (item) {
              return LocalRegistryHelper.manifestsToImage(item);
            });
            var images = LocalRegistryHelper.groupImagesTags(manifests);
            deferred.resolve(images);
          }).catch(function error(err) {
            deferred.reject({
              msg: 'Unable to retrieve repositories',
              err: err
            });
          });
        return deferred.promise;
      };

      service.repositoryImage = function (id, repository, imageId) {
        var deferred = $q.defer();
        RegistryTags.get({
            id: id,
            repository: repository
          }).$promise
          .then(function success(data) {
            var manifestsPromises = [];
            for (var j = 0; j < data.tags.length; j++) {
              var tag = data.tags[j];
              var promise = manifestPromise(id, data, tag);
              manifestsPromises.push(promise);
            }
            return $q.all(manifestsPromises);
          })
          .then(function success(data) {
            var manifests = data.map(function (item) {
              return LocalRegistryHelper.manifestsToImage(item);
            });
            var images = LocalRegistryHelper.groupImagesTags(manifests);
            var image = _.find(images, function (item) {
              return item.Id === imageId;
            });
            deferred.resolve(image);
          }).catch(function error(err) {
            deferred.reject({
              msg: 'Unable to retrieve image information',
              err: err
            });
          });
        return deferred.promise;
      };

      service.deleteManifest = function (id, repository, digest) {
        return RegistryManifests.delete({
          id: id,
          repository: repository,
          tag: digest
        }).$promise;
      };

      service.addTag = function (id, repository, tag, manifest) {
        delete manifest.digest;
        return RegistryManifests.put({
          id: id,
          repository: repository,
          tag: tag
        }, manifest).$promise;
      };

      return service;
    }
  ]);