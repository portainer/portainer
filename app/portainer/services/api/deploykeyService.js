angular.module('portainer.app')
.factory('DeploykeyService', ['$q', 'Deploykeys', function DeploykeyServiceFactory($q, Deploykeys) {
  'use strict';
  var service = {};

  service.deploykeys = function() {
    var deferred = $q.defer();
    Deploykeys.query().$promise
    .then(function success(data) {
      var deploykeys = data.map(function (item) {
        return new DeploykeyViewModel(item);
      });
      deferred.resolve(deploykeys);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve keys', err: err});
    });
    return deferred.promise;
  };

  service.deploykeyNames = function() {
    var deferred = $q.defer();
    Deploykeys.query().$promise
    .then(function success(data) {
      var deploykeys = data.map(function (item) {
        return item.Name;
      });
      deferred.resolve(deploykeys);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve keys', err: err});
    });
    return deferred.promise;
  };

  service.createDeploykey = function(name, pubKey, priKey) {
    var payload = {
      Name: name,
      Pubkey : pubKey,
      Prikey : priKey,
    };

    return Deploykeys.create({}, payload).$promise;
  };

  service.deleteDeploykey = function(id) {
    return Deploykeys.remove({id: id}).$promise;
  };

  return service;
}]);
