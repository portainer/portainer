import splitargs from 'splitargs/src/splitargs'

angular.module('portainer.docker')
.factory('ContainerHelper', [function ContainerHelperFactory() {
  'use strict';
  var helper = {};

  helper.commandStringToArray = function(command) {
    return splitargs(command);
  };

  helper.commandArrayToString = function(array) {
    return array.map(function(elem) {
      return '\'' + elem + '\'';
    }).join(' ');
  };

  helper.configFromContainer = function(container) {
    var config = container.Config;
    // HostConfig
    config.HostConfig = container.HostConfig;
    // Name
    config.name = container.Name.replace(/^\//g, '');
    // Network
    var mode = config.HostConfig.NetworkMode;
    config.NetworkingConfig = {
      'EndpointsConfig': {}
    };
    config.NetworkingConfig.EndpointsConfig = container.NetworkSettings.Networks;
    if (mode.indexOf('container:') !== -1) {
      delete config.Hostname;
      delete config.ExposedPorts;
    }
    // Set volumes
    var binds = [];
    var volumes = {};
    for (var v in container.Mounts) {
      if ({}.hasOwnProperty.call(container.Mounts, v)) {
        var mount = container.Mounts[v];
        var name = mount.Name || mount.Source;
        var containerPath = mount.Destination;
        if (name && containerPath) {
          var bind = name + ':' + containerPath;
          volumes[containerPath] = {};
          if (mount.RW === false) {
            bind += ':ro';
          }
          binds.push(bind);
        }
      }
    }
    config.HostConfig.Binds = binds;
    config.Volumes = volumes;
    return config;
  };

  return helper;
}]);
