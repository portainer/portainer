angular.module('portainer.services')
.factory('PluginService', ['$q', 'Plugin', function PluginServiceFactory($q, Plugin) {
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

  service.volumePlugins = function() {
    var deferred = $q.defer();

    service.plugins()
    .then(function success(data) {
      var volumePlugins = data.filter(function filter(plugin) {
        if (plugin.Enabled && _.includes(plugin.Config.Interface.Types, 'docker.volumedriver/1.0')) {
          return plugin;
        }
      });
      deferred.resolve(volumePlugins);
    })
    .catch(function error(err) {
      deferred.reject({ msg: err.msg, err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
