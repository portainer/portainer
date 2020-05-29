import _ from 'lodash-es';
import { PluginViewModel } from '../models/plugin';

angular.module('portainer.docker').factory('PluginService', [
  '$q',
  'Plugin',
  'SystemService',
  function PluginServiceFactory($q, Plugin, SystemService) {
    'use strict';
    var service = {};

    service.plugins = function () {
      var deferred = $q.defer();
      var plugins = [];

      Plugin.query({})
        .$promise.then(function success(data) {
          for (var i = 0; i < data.length; i++) {
            var plugin = new PluginViewModel(data[i]);
            plugins.push(plugin);
          }
        })
        .finally(function final() {
          deferred.resolve(plugins);
        });

      return deferred.promise;
    };

    function servicePlugins(systemOnly, pluginType, pluginVersion) {
      var deferred = $q.defer();

      $q.all({
        system: SystemService.plugins(),
        plugins: systemOnly ? [] : service.plugins(),
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

    service.volumePlugins = function (systemOnly) {
      return servicePlugins(systemOnly, 'Volume', 'docker.volumedriver/1.0');
    };

    service.networkPlugins = function (systemOnly) {
      return servicePlugins(systemOnly, 'Network', 'docker.networkdriver/1.0');
    };

    service.loggingPlugins = function (systemOnly) {
      return servicePlugins(systemOnly, 'Log', 'docker.logdriver/1.0');
    };

    return service;
  },
]);
