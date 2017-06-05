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

  service.createRegistry = function(name, URL) {
    var payload = {
      Name: name,
      URL: URL
    };
    return Registries.create({}, payload).$promise;
  };

  service.createRegistryWithAuthentication = function(name, URL, username, password) {
    var deferred = $q.defer();

    
    // success
    deferred.resolve();
    // error
    deferred.reject({ msg: '', err: err });
    return deferred.promise;
  };

  return service;
}]);
