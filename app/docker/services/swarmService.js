import { SwarmViewModel } from '../models/swarm';

angular.module('portainer.docker').factory('SwarmService', [
  '$q',
  'Swarm',
  function SwarmServiceFactory($q, Swarm) {
    'use strict';
    var service = {};

    service.swarm = function () {
      var deferred = $q.defer();

      Swarm.get()
        .$promise.then(function success(data) {
          var swarm = new SwarmViewModel(data);
          deferred.resolve(swarm);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve Swarm details', err: err });
        });

      return deferred.promise;
    };

    return service;
  },
]);
