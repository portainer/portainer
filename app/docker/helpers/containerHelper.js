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

  helper.parsePortRange = function(ports) {
    if (!ports) {
      return null;
    }

    var rangeIndex = ports.indexOf('-');
    if (rangeIndex === -1) {
      var port = parseInt(ports);
      if (isNaN(port) || port <= 0 || port > 0xffff) {
        return null;
      }

      return [port, port];
    }

    var startPort = parseInt(ports.substr(0, rangeIndex));
    if (isNaN(startPort) || startPort <= 0 || startPort > 0xffff) {
      return null;
    }

    var endPort = parseInt(ports.substr(rangeIndex + 1));
    if (isNaN(endPort) || endPort <= 0 || endPort > 0xffff) {
      return null;
    }

    if (endPort < startPort) {
      return null;
    }

    return [startPort, endPort];
  };

  return helper;
}]);
