angular.module('portainer.app')
.factory('PortainerPluginService', ['PortainerPlugin', function PortainerPluginServiceFactory(PortainerPlugin) {
  'use strict';
  var service = {};

  service.enable = function(pluginType) {
    return PortainerPlugin.create({ PluginType: pluginType }).$promise;
  };

  return service;
}]);
