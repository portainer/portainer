angular.module('portainer.services')
.factory('PluginService', ['$q', 'Plugin', 'SystemService', function PluginServiceFactory($q, Plugin, SystemService) {
  'use strict';
  var service = {};

  service.plugins = function() {
    var deferred = $q.defer();

    Plugin.query({}).$promise
    .then(function success(data) {
      var plugins = data.map(function (item) {
        return new PluginViewModel(item);
      });
      deferred.resolve(plugins);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve plugins', err: err });
    });

    return deferred.promise;
  };

  service.volumePlugins = function(systemOnly) {
    var deferred = $q.defer();

    $q.all({
      system: SystemService.plugins(),
      plugins: systemOnly ? [] : service.plugins()
    })
    .then(function success(data) {
      var volumePlugins = [];
      var systemPlugins = data.system;
      var plugins = data.plugins;

      if (systemPlugins.Volume) {
        volumePlugins = volumePlugins.concat(systemPlugins.Volume);
      }

      for (var i = 0; i < plugins.length; i++) {
        var plugin = plugins[i];
        if (plugin.Enabled && _.includes(plugin.Config.Interface.Types, 'docker.volumedriver/1.0')) {
          volumePlugins.push(plugin.Name);
        }
      }

      deferred.resolve(volumePlugins);
    })
    .catch(function error(err) {
      deferred.reject({ msg: err.msg, err: err });
    });

    return deferred.promise;
  };

  service.networkPlugins = function(systemOnly) {
    var deferred = $q.defer();

    $q.all({
      system: SystemService.plugins(),
      plugins: systemOnly ? [] : service.plugins()
    })
    .then(function success(data) {
      var networkPlugins = [];
      var systemPlugins = data.system;
      var plugins = data.plugins;

      if (systemPlugins.Network) {
        networkPlugins = networkPlugins.concat(systemPlugins.Network);
      }

      for (var i = 0; i < plugins.length; i++) {
        var plugin = plugins[i];
        if (plugin.Enabled && _.includes(plugin.Config.Interface.Types, 'docker.networkdriver/1.0')) {
          networkPlugins.push(plugin.Name);
        }
      }

      deferred.resolve(networkPlugins);
    })
    .catch(function error(err) {
      deferred.reject({ msg: err.msg, err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
