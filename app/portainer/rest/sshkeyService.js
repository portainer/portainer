angular.module('portainer.app')
.factory('SshkeyService', ['$q', 'Sshkeys', function SshkeyServiceFactory($q, Sshkeys) {
  'use strict';
  var service = {};

  service.sshkeys = function() {
    var deferred = $q.defer();
    Sshkeys.query().$promise
    .then(function success(data) {
      var sshkeys = data.map(function (item) {
        return new SshkeyViewModel(item);
      });      
      deferred.resolve(sshkeys);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve keys', err: err});
    });
    return deferred.promise;
  };
  
  service.createNewkeyNames = function() {
    var deferred = $q.defer();
    Sshkeys.query().$promise
    .then(function success(data) {
      var sshkeys = data.map(function (item) {
        return item.Name;
      });
      deferred.resolve(sshkeys);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve keys', err: err});
    });
    return deferred.promise;
  };

  service.createNewsshkey = function(name) {
    var payload = {
      Name: name
    };
    return Sshkeys.create({}, payload).$promise;
  };

  service.deleteNewsshkey = function(id) {
    return Sshkeys.remove({id: id}).$promise;
  };

  return service;
}]);
