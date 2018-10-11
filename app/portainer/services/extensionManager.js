import angular from 'angular';
import _ from 'lodash';

angular.module('portainer.app')
.factory('ExtensionManager', ['$q', 'PluginService', 'SystemService', 'ExtensionService',
function ExtensionManagerFactory($q, PluginService, SystemService, ExtensionService) {
  'use strict';
  var service = {};

  service.initEndpointExtensions = function() {
    var deferred = $q.defer();

    SystemService.version()
    .then(function success(data) {
      var endpointAPIVersion = parseFloat(data.ApiVersion);

      return $q.all([
        endpointAPIVersion >= 1.25 ? initStoridgeExtension(): {}
      ]);
    })
    .then(function success(data) {
      var extensions = data;
      deferred.resolve(extensions);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to connect to the Docker environment', err: err });
    });

    return deferred.promise;
  };

  function initStoridgeExtension() {
    var deferred = $q.defer();

    PluginService.volumePlugins()
    .then(function success(data) {
      var volumePlugins = data;
      if (_.includes(volumePlugins, 'cio:latest')) {
        return registerStoridgeUsingSwarmManagerIP();
      } else {
        return deregisterStoridgeExtension();
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

  function registerStoridgeUsingSwarmManagerIP() {
    var deferred = $q.defer();

    SystemService.info()
    .then(function success(data) {
      var managerIP = data.Swarm.NodeAddr;
      var storidgeAPIURL = 'tcp://' + managerIP + ':8282';
      return ExtensionService.registerStoridgeExtension(storidgeAPIURL);
    })
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'An error occured during Storidge extension initialization', err: err });
    });

    return deferred.promise;
  }

  function deregisterStoridgeExtension() {
    return ExtensionService.deregisterStoridgeExtension();
  }

  return service;
}]);
