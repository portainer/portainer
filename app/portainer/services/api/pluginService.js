angular.module('portainer.app')
.factory('PortainerPluginService', ['$q', 'PortainerPlugin', function PortainerPluginServiceFactory($q, PortainerPlugin) {
  'use strict';
  var service = {};

  service.enable = function(license) {
    return PortainerPlugin.create({ license: license }).$promise;
  };

  service.update = function(id, version) {
    return PortainerPlugin.update({ id: id, version: version }).$promise;
  };

  service.delete = function(id) {
    return PortainerPlugin.delete({ id: id }).$promise;
  };

  service.plugins = function(store) {
    var deferred = $q.defer();

    PortainerPlugin.query({ store: store }).$promise
    .then(function success(data) {
      var plugins = data.map(function (item) {
        return new PortainerPluginViewModel(item);
      });
      deferred.resolve(plugins);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve plugins', err: err});
    });

    return deferred.promise;
  };

  service.plugin = function(id, store) {
    var deferred = $q.defer();

    PortainerPlugin.get({ id: id, store: store }).$promise
    .then(function success(data) {
      var plugin = new PortainerPluginViewModel(data);
      deferred.resolve(plugin);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve plugin details', err: err});
    });

    return deferred.promise;
  };

  return service;
}]);
