angular.module('portainer.services')
.factory('RegistryService', ['$q', 'Registries', function RegistryServiceFactory($q, Registries) {
  'use strict';
  var service = {};

  service.registries = function() {
    var deferred = $q.defer();
    Registries.query().$promise
    .then(function success(data) {
      var registries = data.map(function (item) {
        return new RegistryViewModel(item);
      });
      deferred.resolve(registries);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve registries', err: err});
    });
    return deferred.promise;
  };

  service.registry = function(id) {
    var deferred = $q.defer();
    Registries.get({id: id}).$promise
    .then(function success(data) {
      var registry = new RegistryViewModel(data);
      deferred.resolve(registry);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve registry details', err: err});
    });
    return deferred.promise;
  };

  service.deleteRegistry = function(id) {
    return Registries.remove({id: id}).$promise;
  };

  return service;
}]);
