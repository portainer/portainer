angular.module('portainer.app')
.factory('ExtensionManager', ['$q', 'PluginService', 'SystemService', 'ExtensionService',
function ExtensionManagerFactory($q, PluginService, SystemService, ExtensionService) {
  'use strict';
  var service = {};

  service.initEndpointExtensions = function(endpointId) {
    var deferred = $q.defer();

    SystemService.version()
    .then(function success(data) {
      var endpointAPIVersion = parseFloat(data.ApiVersion);

      return $q.all([
        endpointAPIVersion >= 1.25 ? initStoridgeExtension(endpointId): null
      ]);
    })
    .then(function success(data) {
      var extensions = data.filter(function filterNull(x) {
        return x;
      });
      deferred.resolve(extensions);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to connect to the Docker environment', err: err });
    });

    return deferred.promise;
  };

  function initStoridgeExtension(endpointId) {
    var deferred = $q.defer();

    PluginService.volumePlugins()
    .then(function success(data) {
      var volumePlugins = data;
      if (_.includes(volumePlugins, 'cio:latest')) {
        return registerStoridgeUsingSwarmManagerIP(endpointId);
      }
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'An error occured during Storidge extension check', err: err });
    });

    return deferred.promise;
  }

  function registerStoridgeUsingSwarmManagerIP(endpointId) {
    var deferred = $q.defer();

    SystemService.info()
    .then(function success(data) {
      var managerIP = data.Swarm.NodeAddr;
      var storidgeAPIURL = 'tcp://' + managerIP + ':8282';
      return ExtensionService.registerStoridgeExtension(endpointId, storidgeAPIURL);
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'An error occured during Storidge extension initialization', err: err });
    });

    return deferred.promise;
  }

  return service;
}]);
