angular.module('portainer.app')
.factory('TemplateService', ['$q', 'Template', 'TemplateHelper', 'ImageHelper', 'ContainerHelper', function TemplateServiceFactory($q, Template, TemplateHelper, ImageHelper, ContainerHelper) {
  'use strict';
  var service = {};

  service.getTemplates = function(key) {
    var deferred = $q.defer();
    Template.get({key: key}).$promise
    .then(function success(data) {
      var templates = data.map(function (tpl, idx) {
        var template;
        if (tpl.type === 'stack') {
          template = new StackTemplateViewModel(tpl);
        } else if (tpl.type === 'container' && key === 'linuxserver.io') {
          template = new TemplateLSIOViewModel(tpl);
        } else {
          template = new TemplateViewModel(tpl);
        }
        template.index = idx;
        return template;
      });
      if (key === 'linuxserver.io') {
        templates = TemplateHelper.filterLinuxServerIOTemplates(templates);
      }
      deferred.resolve(templates);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve templates', err: err });
    });
    return deferred.promise;
  };

  service.createTemplateConfiguration = function(template, containerName, network, containerMapping) {
    var imageConfiguration = ImageHelper.createImageConfigForContainer(template.Image, template.Registry);
    var containerConfiguration = service.createContainerConfiguration(template, containerName, network, containerMapping);
    containerConfiguration.Image = imageConfiguration.fromImage + ':' + imageConfiguration.tag;
    return containerConfiguration;
  };

  service.createContainerConfiguration = function(template, containerName, network, containerMapping) {
    var configuration = TemplateHelper.getDefaultContainerConfiguration();
    configuration.HostConfig.NetworkMode = network.Name;
    configuration.HostConfig.Privileged = template.Privileged;
    configuration.HostConfig.RestartPolicy = { Name: template.RestartPolicy };
    configuration.HostConfig.ExtraHosts = template.Hosts ? template.Hosts : [];
    configuration.name = containerName;
    configuration.Hostname = containerName;
    configuration.Image = template.Image;
    configuration.Env = TemplateHelper.EnvToStringArray(template.Env, containerMapping);
    configuration.Cmd = ContainerHelper.commandStringToArray(template.Command);
    var portConfiguration = TemplateHelper.portArrayToPortConfiguration(template.Ports);
    configuration.HostConfig.PortBindings = portConfiguration.bindings;
    configuration.ExposedPorts = portConfiguration.exposedPorts;
    var consoleConfiguration = TemplateHelper.getConsoleConfiguration(template.Interactive);
    configuration.OpenStdin = consoleConfiguration.openStdin;
    configuration.Tty = consoleConfiguration.tty;
    configuration.Labels = TemplateHelper.updateContainerConfigurationWithLabels(template.Labels);
    return configuration;
  };

  service.updateContainerConfigurationWithVolumes = function(configuration, template, generatedVolumesPile) {
    var volumes = template.Volumes;
    TemplateHelper.createVolumeBindings(volumes, generatedVolumesPile);
    volumes.forEach(function (volume) {
      if (volume.binding) {
        configuration.Volumes[volume.containerPath] = {};
        configuration.HostConfig.Binds.push(volume.binding);
      }
    });
  };

  return service;
}]);
