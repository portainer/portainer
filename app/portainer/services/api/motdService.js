import { MotdViewModel } from '../../models/motd';

angular.module('portainer.app')
.factory('MotdService', ['$q', 'Motd', function MotdServiceFactory($q, Motd) {
  'use strict';
  var service = {};

  service.motd = function() {
    var deferred = $q.defer();

    Motd.get().$promise
    .then(function success(data) {
      var motd = new MotdViewModel(data);
      deferred.resolve(motd);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve information message', err: err});
    });

    return deferred.promise;
  };

  return service;
}]);
