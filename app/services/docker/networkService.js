angular.module('portainer.services')
.factory('NetworkService', ['$q', 'Network', function NetworkServiceFactory($q, Network) {
  'use strict';
  var service = {};

  service.networks = function(localNetworks, swarmNetworks, swarmAttachableNetworks, globalNetworks) {
    var deferred = $q.defer();

    Network.query({}).$promise
    .then(function success(data) {
      var networks = data;

      var filteredNetworks = networks.filter(function(network) {
        if (localNetworks && network.Scope === 'local') {
          return network;
        }
        if (swarmNetworks && network.Scope === 'swarm') {
          return network;
        }
        if (swarmAttachableNetworks && network.Scope === 'swarm' && network.Attachable === true) {
          return network;
        }
        if (globalNetworks && network.Scope === 'global') {
          return network;
        }
      })
      .map(function (item) {
        return new NetworkViewModel(item);
      });

      deferred.resolve(filteredNetworks);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve networks', err: err});
    });

    return deferred.promise;
  };

  return service;
}]);
