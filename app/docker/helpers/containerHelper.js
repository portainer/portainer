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

  helper.createPortRange = function(portRange, port) {
    var hostIp = null;
    var colonIndex = portRange.indexOf(':');
    if (colonIndex >= 0) {
      hostIp = portRange.substr(0, colonIndex);
      portRange = portRange.substr(colonIndex + 1);
    }

    var startPort;
    var endPort;
    port = (typeof port === 'number' ? port : parseInt(port));
    portRange = helper.parsePortRange(portRange);
    if (!portRange || portRange.length !== 2) {
      var portSplit = portRange.split('-');
      startPort = parseInt(portSplit[0]);
      endPort = startPort;
    } else {
      startPort = portRange[0];
      endPort = portRange[1];
    }

    if (port < startPort) {
      startPort = port;
    }
    if (port > endPort) {
      endPort = port;
    }

    if (hostIp) {
      return hostIp + ':' + startPort + '-' + endPort;
    } else {
      return startPort + '-' + endPort;
    }
  };

  helper.sortAndCombinePorts = function(portBindings) {
    var bindings = [];
    var previousHostPort = null;
    var previousContainerPort = null;
    Object.keys(portBindings).sort(function(x, y) {
      var xSplit = x.split('/');
      var ySplit = y.split('/');
      var xPort = parseInt(xSplit[0]);
      var yPort = parseInt(ySplit[0]);
      return xPort - yPort;
    }).forEach(function(portKey) {
      if (!portBindings.hasOwnProperty(portKey)) {
        return;
      }

      var portBinding = portBindings[portKey][0];
      var hostPort = portBinding.HostPort;
      var containerPort = portKey.split('/')[0];
      var protocol = portKey.split('/')[1];

      // NOTE: It must be == here, because we are comparing strings with integers
      if (bindings.length > 0 && previousHostPort == (hostPort - 1) && previousContainerPort == (containerPort - 1)) {
        bindings[bindings.length-1].hostPort = helper.createPortRange(bindings[bindings.length-1].hostPort, hostPort);
        bindings[bindings.length-1].containerPort = helper.createPortRange(bindings[bindings.length-1].containerPort, containerPort);
        previousHostPort = hostPort;
        previousContainerPort = containerPort;
        return;
      }

      if (portBinding.HostIp) {
        hostPort = portBinding.HostIp + ':' + hostPort;
      }

      var binding = {
        'hostPort': hostPort,
        'containerPort': containerPort,
        'protocol': protocol
      };
      bindings.push(binding);
      previousHostPort = portBinding.HostPort;
      previousContainerPort = containerPort;
    });
    return bindings;
  };

  return helper;
}]);
