angular.module('portainer.services')
.factory('NetworkService', ['$q', 'Network', function NetworkServiceFactory($q, Network) {
  'use strict';
  var service = {};

  service.networks = function() {
    var deferred = $q.defer();

    Network.query({}).$promise
    .then(function success(data) {
      var networks = data.map(function (item) {
        return new NetworkViewModel(item);
      });
      deferred.resolve(networks);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve networks', err: err });
    });

    return deferred.promise;
  };

  service.retrieveSwarmNetworks = function() {
    var deferred = $q.defer();

    service.networks()
    .then(function success(data) {
      var networks = data.filter(function (network) {
        if (network.Scope === 'swarm') {
          return network;
        }
      });
      deferred.resolve(networks);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve networks', err: err});
    });

    return deferred.promise;
  };

  service.filterGlobalNetworks = function(networks) {
    return networks.filter(function (network) {
      if (network.Scope === 'global') {
        return network;
      }
    });
  };

  service.filterSwarmModeAttachableNetworks = function(networks) {
    return networks.filter(function (network) {
      if (network.Scope === 'swarm' && network.Attachable === true) {
        return network;
      }
    });
  };

  service.addPredefinedLocalNetworks = function(networks) {
    networks.push({Scope: 'local', Name: 'bridge'});
    networks.push({Scope: 'local', Name: 'host'});
    networks.push({Scope: 'local', Name: 'none'});
  };

  return service;
}]);
