angular.module('portainer.app')
.factory('TemplateService', ['$q', 'Templates', 'TemplateHelper', 'ImageHelper', 'ContainerHelper',
function TemplateServiceFactory($q, Templates, TemplateHelper, ImageHelper, ContainerHelper) {
  'use strict';
  var service = {};

  service.templates = function() {
    var deferred = $q.defer();

    Templates.query().$promise
    .then(function success(data) {
      var templates = data.map(function (item) {
        if (item.type === 'container') {
          return new ContainerTemplateViewModel(item);
        }
        return new StackTemplateViewModel(item);
      });
      deferred.resolve(templates);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve templates', err: err });
    });

    return deferred.promise;
  };

  service.template = function(id) {
    var deferred = $q.defer();

    Templates.get({ id: id }).$promise
    .then(function success(data) {
      var template;
      if (data.type === 'container') {
        template = new ContainerTemplateViewModel(data);
      } else {
        template = new StackTemplateViewModel(data);
      }
      deferred.resolve(template);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve template details', err: err });
    });


    return deferred.promise;
  };

  service.delete = function(id) {
    return Templates.remove({ id: id }).$promise;
  };

  service.createTemplate = function(model) {
    var payload = new TemplateCreateRequest(model);
    return Templates.create(payload).$promise;
  };

  service.updateTemplate = function(model) {
    var payload = new TemplateUpdateRequest(model);
    return Templates.update(payload).$promise;
  };

  // TODO: remove
  service.getTemplates = function(key) {
    var deferred = $q.defer();
    Templates.get({key: key}).$promise
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
    configuration.Hostname = template.Hostname;
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
