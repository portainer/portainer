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

  function servicePlugins(systemOnly, pluginType, pluginVersion) {
    var deferred = $q.defer();

    $q.all({
      system: SystemService.plugins(),
      plugins: systemOnly ? [] : service.plugins()
    })
    .then(function success(data) {
      var aggregatedPlugins = [];
      var systemPlugins = data.system;
      var plugins = data.plugins;

      if (systemPlugins[pluginType]) {
        aggregatedPlugins = aggregatedPlugins.concat(systemPlugins[pluginType]);
      }

      for (var i = 0; i < plugins.length; i++) {
        var plugin = plugins[i];
        if (plugin.Enabled && _.includes(plugin.Config.Interface.Types, pluginVersion)) {
          aggregatedPlugins.push(plugin.Name);
        }
      }

      deferred.resolve(aggregatedPlugins);
    })
    .catch(function error(err) {
      deferred.reject({ msg: err.msg, err: err });
    });

    return deferred.promise;
  }

  service.volumePlugins = function(systemOnly) {
    return servicePlugins(systemOnly, 'Volume', 'docker.volumedriver/1.0');
  };

  service.networkPlugins = function(systemOnly) {
    return servicePlugins(systemOnly, 'Network', 'docker.networkdriver/1.0');
  };

  return service;
}]);
