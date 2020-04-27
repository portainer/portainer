import _ from 'lodash-es';

angular.module('portainer.app').factory('TemplateHelper', [
  function TemplateHelperFactory() {
    'use strict';
    var helper = {};

    helper.getDefaultContainerConfiguration = function () {
      return {
        Env: [],
        OpenStdin: false,
        Tty: false,
        ExposedPorts: {},
        HostConfig: {
          RestartPolicy: {
            Name: 'no',
          },
          PortBindings: {},
          Binds: [],
          Privileged: false,
          ExtraHosts: [],
        },
        Volumes: {},
        Labels: {},
      };
    };

    helper.portArrayToPortConfiguration = function (ports) {
      var portConfiguration = {
        bindings: {},
        exposedPorts: {},
      };
      ports.forEach(function (p) {
        if (p.containerPort) {
          var key = p.containerPort + '/' + p.protocol;
          var binding = {};
          if (p.hostPort) {
            binding.HostPort = p.hostPort;
            if (p.hostPort.indexOf(':') > -1) {
              var hostAndPort = p.hostPort.split(':');
              binding.HostIp = hostAndPort[0];
              binding.HostPort = hostAndPort[1];
            }
          }
          portConfiguration.bindings[key] = [binding];
          portConfiguration.exposedPorts[key] = {};
        }
      });
      return portConfiguration;
    };

    helper.updateContainerConfigurationWithLabels = function (labelsArray) {
      var labels = {};
      labelsArray.forEach(function (l) {
        if (l.name) {
          if (l.value) {
            labels[l.name] = l.value;
          } else {
            labels[l.name] = '';
          }
        }
      });
      return labels;
    };

    helper.EnvToStringArray = function (templateEnvironment) {
      var env = [];
      templateEnvironment.forEach(function (envvar) {
        if (envvar.value || envvar.set) {
          var value = envvar.set ? envvar.set : envvar.value;
          env.push(envvar.name + '=' + value);
        }
      });
      return env;
    };

    helper.getConsoleConfiguration = function (interactiveFlag) {
      var consoleConfiguration = {
        openStdin: false,
        tty: false,
      };
      if (interactiveFlag === true) {
        consoleConfiguration.openStdin = true;
        consoleConfiguration.tty = true;
      }
      return consoleConfiguration;
    };

    helper.createVolumeBindings = function (volumes, generatedVolumesPile) {
      volumes.forEach(function (volume) {
        if (volume.container) {
          var binding;
          if (volume.type === 'auto') {
            binding = generatedVolumesPile.pop().Id + ':' + volume.container;
          } else if (volume.type !== 'auto' && volume.bind) {
            binding = volume.bind + ':' + volume.container;
          }
          if (volume.readonly) {
            binding += ':ro';
          }
          volume.binding = binding;
        }
      });
    };

    helper.determineRequiredGeneratedVolumeCount = function (volumes) {
      var count = 0;
      volumes.forEach(function (volume) {
        if (volume.type === 'auto') {
          ++count;
        }
      });
      return count;
    };

    helper.getUniqueCategories = function (templates) {
      var categories = [];
      for (var i = 0; i < templates.length; i++) {
        var template = templates[i];
        categories = categories.concat(template.Categories);
      }
      return _.uniq(categories);
    };

    return helper;
  },
]);
