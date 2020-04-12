import { ConfigViewModel } from '../models/config';

angular.module('portainer.docker').factory('ConfigService', [
  '$q',
  'Config',
  function ConfigServiceFactory($q, Config) {
    'use strict';
    var service = {};

    service.config = function (configId) {
      var deferred = $q.defer();

      Config.get({ id: configId })
        .$promise.then(function success(data) {
          var config = new ConfigViewModel(data);
          deferred.resolve(config);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve config details', err: err });
        });

      return deferred.promise;
    };

    service.configs = function () {
      var deferred = $q.defer();

      Config.query({})
        .$promise.then(function success(data) {
          var configs = data.map(function (item) {
            return new ConfigViewModel(item);
          });
          deferred.resolve(configs);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve configs', err: err });
        });

      return deferred.promise;
    };

    service.remove = function (configId) {
      var deferred = $q.defer();

      Config.remove({ id: configId })
        .$promise.then(function success(data) {
          if (data.message) {
            deferred.reject({ msg: data.message });
          } else {
            deferred.resolve();
          }
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to remove config', err: err });
        });

      return deferred.promise;
    };

    service.create = function (config) {
      return Config.create(config).$promise;
    };

    return service;
  },
]);
