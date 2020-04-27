import { SecretViewModel } from '../models/secret';

angular.module('portainer.docker').factory('SecretService', [
  '$q',
  'Secret',
  function SecretServiceFactory($q, Secret) {
    'use strict';
    var service = {};

    service.secret = function (secretId) {
      var deferred = $q.defer();

      Secret.get({ id: secretId })
        .$promise.then(function success(data) {
          var secret = new SecretViewModel(data);
          deferred.resolve(secret);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve secret details', err: err });
        });

      return deferred.promise;
    };

    service.secrets = function () {
      var deferred = $q.defer();

      Secret.query({})
        .$promise.then(function success(data) {
          var secrets = data.map(function (item) {
            return new SecretViewModel(item);
          });
          deferred.resolve(secrets);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve secrets', err: err });
        });

      return deferred.promise;
    };

    service.remove = function (secretId) {
      var deferred = $q.defer();

      Secret.remove({ id: secretId })
        .$promise.then(function success(data) {
          if (data.message) {
            deferred.reject({ msg: data.message });
          } else {
            deferred.resolve();
          }
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to remove secret', err: err });
        });

      return deferred.promise;
    };

    service.create = function (secretConfig) {
      return Secret.create(secretConfig).$promise;
    };

    return service;
  },
]);
