import _ from 'lodash-es';
import splitargs from 'splitargs/src/splitargs';

const portPattern = /^([1-9]|[1-5]?[0-9]{2,4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/m;

function parsePort(port) {
  if (portPattern.test(port)) {
    return parseInt(port, 10);
  } else {
    return 0;
  }
}

function parsePortRange(portRange) {
  if (typeof portRange !== 'string') {
    portRange = portRange.toString();
  }

  // Split the range and convert to integers
  const stringPorts = _.split(portRange, '-', 2);
  const intPorts = _.map(stringPorts, parsePort);

  // If it's not a range, we still make sure that we return two ports (start & end)
  if (intPorts.length == 1) {
    intPorts.push(intPorts[0]);
  }

  return intPorts;
}

function isValidPortRange(portRange) {
  if (typeof portRange === 'string') {
    portRange = parsePortRange();
  }

  return Array.isArray(portRange) && portRange.length === 2 && portRange[0] > 0 && portRange[1] >= portRange[0];
}

function createPortRange(portRangeText, port) {
  if (typeof portRangeText !== 'string') {
    portRangeText = portRangeText.toString();
  }

  let hostIp = null;
  const colonIndex = portRangeText.indexOf(':');
  if (colonIndex >= 0) {
    hostIp = portRangeText.substr(0, colonIndex);
    portRangeText = portRangeText.substr(colonIndex + 1);
  }

  port = typeof port === 'number' ? port : parsePort(port);
  const portRange = parsePortRange(portRangeText);
  const startPort = Math.min(portRange[0], port);
  const endPort = Math.max(portRange[1], port);

  if (hostIp) {
    return hostIp + ':' + startPort + '-' + endPort;
  } else {
    return startPort + '-' + endPort;
  }
}

angular.module('portainer.docker').factory('ContainerHelper', [
  function ContainerHelperFactory() {
    'use strict';
    var helper = {};

    helper.commandStringToArray = function (command) {
      return splitargs(command);
    };

    helper.commandArrayToString = function (array) {
      return array
        .map(function (elem) {
          return "'" + elem + "'";
        })
        .join(' ');
    };

    helper.configFromContainer = function (container) {
      var config = container.Config;
      // HostConfig
      config.HostConfig = container.HostConfig;
      // Name
      config.name = container.Name.replace(/^\//g, '');
      // Network
      var mode = config.HostConfig.NetworkMode;
      config.NetworkingConfig = {
        EndpointsConfig: {},
      };
      config.NetworkingConfig.EndpointsConfig = container.NetworkSettings.Networks;

      if (config.ExposedPorts === undefined) {
        config.ExposedPorts = {};
      }

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

    helper.preparePortBindings = function (portBindings) {
      const bindings = {};
      _.forEach(portBindings, (portBinding) => {
        if (!portBinding.containerPort) {
          return;
        }

        let hostPort = portBinding.hostPort;
        const containerPortRange = parsePortRange(portBinding.containerPort);
        if (!isValidPortRange(containerPortRange)) {
          throw new Error('Invalid port specification: ' + portBinding.containerPort);
        }

        const startPort = containerPortRange[0];
        const endPort = containerPortRange[1];
        let hostIp = undefined;
        let startHostPort = 0;
        let endHostPort = 0;
        if (hostPort) {
          if (hostPort.indexOf('[') > -1) {
            const hostAndPort = _.split(hostPort, ']:');

            if (hostAndPort.length < 2) {
              throw new Error('Invalid port specification: ' + portBinding.containerPort);
            }

            hostIp = hostAndPort[0].replace('[', '');
            hostPort = hostAndPort[1];
          } else {
            if (hostPort.indexOf(':') > -1) {
              const hostAndPort = _.split(hostPort, ':');
              hostIp = hostAndPort[0];
              hostPort = hostAndPort[1];
            }
          }

          const hostPortRange = parsePortRange(hostPort);
          if (!isValidPortRange(hostPortRange)) {
            throw new Error('Invalid port specification: ' + hostPort);
          }

          startHostPort = hostPortRange[0];
          endHostPort = hostPortRange[1];
          if (endPort !== startPort && endPort - startPort !== endHostPort - startHostPort) {
            throw new Error('Invalid port specification: ' + hostPort);
          }
        }

        for (let i = 0; i <= endPort - startPort; i++) {
          const containerPort = (startPort + i).toString();
          if (startHostPort > 0) {
            hostPort = (startHostPort + i).toString();
          }
          if (startPort === endPort && startHostPort !== endHostPort) {
            hostPort += '-' + endHostPort.toString();
          }

          const bindKey = containerPort + '/' + portBinding.protocol;
          if (bindings[bindKey]) {
            bindings[bindKey].push({ HostIp: hostIp, HostPort: hostPort });
          } else {
            bindings[bindKey] = [{ HostIp: hostIp, HostPort: hostPort }];
          }
        }
      });
      return bindings;
    };

    helper.sortAndCombinePorts = function (portBindings) {
      const bindings = [];
      const portBindingKeys = _.keys(portBindings);

      // Group the port bindings by protocol
      const portBindingKeysByProtocol = _.groupBy(portBindingKeys, (portKey) => {
        return _.split(portKey, '/')[1];
      });

      _.forEach(portBindingKeysByProtocol, (portBindingKeys, protocol) => {
        // Group the port bindings by host IP
        const portBindingKeysByHostIp = {};
        for (const portKey of portBindingKeys) {
          for (const portBinding of portBindings[portKey]) {
            portBindingKeysByHostIp[portBinding.HostIp] = portBindingKeysByHostIp[portBinding.HostIp] || [];
            portBindingKeysByHostIp[portBinding.HostIp].push(portKey);
          }
        }

        _.forEach(portBindingKeysByHostIp, (portBindingKeys, ip) => {
          // Sort by host port
          const sortedPortBindingKeys = _.orderBy(portBindingKeys, (portKey) => {
            return parseInt(_.split(portKey, '/')[0], 10);
          });

          let previousHostPort = -1;
          let previousContainerPort = -1;
          _.forEach(sortedPortBindingKeys, (portKey) => {
            const portKeySplit = _.split(portKey, '/');
            const containerPort = parseInt(portKeySplit[0], 10);
            const portBinding = portBindings[portKey][0];
            portBindings[portKey].shift();
            const hostPort = parsePort(portBinding.HostPort);

            // We only combine single ports, and skip the host port ranges on one container port
            if (hostPort > 0) {
              // If we detect consecutive ports, we create a range of them
              if (bindings.length > 0 && previousHostPort === hostPort - 1 && previousContainerPort === containerPort - 1) {
                bindings[bindings.length - 1].hostPort = createPortRange(bindings[bindings.length - 1].hostPort, hostPort);
                bindings[bindings.length - 1].containerPort = createPortRange(bindings[bindings.length - 1].containerPort, containerPort);
                previousHostPort = hostPort;
                previousContainerPort = containerPort;
                return;
              }

              previousHostPort = hostPort;
              previousContainerPort = containerPort;
            } else {
              previousHostPort = -1;
              previousContainerPort = -1;
            }

            let bindingHostPort = portBinding.HostPort.toString();
            if (ip) {
              bindingHostPort = `${ip}:${bindingHostPort}`;
            }

            const binding = {
              hostPort: bindingHostPort,
              containerPort: containerPort,
              protocol: protocol,
            };
            bindings.push(binding);
          });
        });
      });

      return bindings;
    };

    return helper;
  },
]);
