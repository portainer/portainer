import {
  TemplateViewModel,
  TemplateCreateRequest,
  TemplateUpdateRequest
} from '../../models/template';

angular.module('portainer.app')
.factory('TemplateService', ['$q', 'Templates', 'TemplateHelper', 'RegistryService', 'DockerHubService', 'ImageHelper', 'ContainerHelper',
function TemplateServiceFactory($q, Templates, TemplateHelper, RegistryService, DockerHubService, ImageHelper, ContainerHelper) {
  'use strict';
  var service = {};

  service.templates = function() {
    var deferred = $q.defer();

    $q.all({
      templates: Templates.query().$promise,
      registries: RegistryService.registries(),
      dockerhub: DockerHubService.dockerhub()
    })
    .then(function success(data) {
      const templates = data.templates.map(function (item) {
        const res = new TemplateViewModel(item);
        const registry = RegistryService.retrievePorRegistryModelFromRepositoryWithRegistries(res.RegistryModel.Registry.URL, data.registries, data.dockerhub);
        registry.Image = res.RegistryModel.Image;
        res.RegistryModel = registry;
        return res;
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
    let template;
    Templates.get({ id: id }).$promise
    .then(function success(data) {
      template = new TemplateViewModel(data);
      return RegistryService.retrievePorRegistryModelFromRepository(template.RegistryModel.Registry.URL);
    })
    .then((registry) => {
      registry.Image = template.RegistryModel.Image;
      template.RegistryModel = registry;
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

  service.create = function(model) {
    var payload = new TemplateCreateRequest(model);
    return Templates.create(payload).$promise;
  };

  service.update = function(model) {
    var payload = new TemplateUpdateRequest(model);
    return Templates.update(payload).$promise;
  };

  service.createTemplateConfiguration = function(template, containerName, network) {
    var imageConfiguration = ImageHelper.createImageConfigForContainer(template.RegistryModel);
    var containerConfiguration = createContainerConfiguration(template, containerName, network);
    containerConfiguration.Image = imageConfiguration.fromImage;
    return containerConfiguration;
  };

  function createContainerConfiguration(template, containerName, network) {
    var configuration = TemplateHelper.getDefaultContainerConfiguration();
    configuration.HostConfig.NetworkMode = network.Name;
    configuration.HostConfig.Privileged = template.Privileged;
    configuration.HostConfig.RestartPolicy = { Name: template.RestartPolicy };
    configuration.HostConfig.ExtraHosts = template.Hosts ? template.Hosts : [];
    configuration.name = containerName;
    configuration.Hostname = template.Hostname;
    configuration.Env = TemplateHelper.EnvToStringArray(template.Env);
    configuration.Cmd = ContainerHelper.commandStringToArray(template.Command);
    var portConfiguration = TemplateHelper.portArrayToPortConfiguration(template.Ports);
    configuration.HostConfig.PortBindings = portConfiguration.bindings;
    configuration.ExposedPorts = portConfiguration.exposedPorts;
    var consoleConfiguration = TemplateHelper.getConsoleConfiguration(template.Interactive);
    configuration.OpenStdin = consoleConfiguration.openStdin;
    configuration.Tty = consoleConfiguration.tty;
    configuration.Labels = TemplateHelper.updateContainerConfigurationWithLabels(template.Labels);

    if (template.MemoryLimit > 0) {
      // Memory Limit - Round to 0.125
      var memoryLimit = (Math.round(template.MemoryLimit * 8) / 8).toFixed(3);
      memoryLimit *= 1024 * 1024;
      configuration.HostConfig.Memory = memoryLimit;
    }
    if (template.MemoryReservation > 0) {
      // Memory Reservation - Round to 0.125
      var memoryReservation = (Math.round(template.MemoryReservation * 8) / 8).toFixed(3);
      memoryReservation *= 1024 * 1024;
      configuration.HostConfig.MemoryReservation = memoryReservation;
    }
    if (template.CpuLimit > 0) {
      // CPU Limit
      configuration.HostConfig.NanoCpus = template.CpuLimit * 1000000000;
    }

    return configuration;
  }

  service.updateContainerConfigurationWithVolumes = function(configuration, template, generatedVolumesPile) {
    var volumes = template.Volumes;
    TemplateHelper.createVolumeBindings(volumes, generatedVolumesPile);
    volumes.forEach(function (volume) {
      if (volume.binding) {
        configuration.Volumes[volume.container] = {};
        configuration.HostConfig.Binds.push(volume.binding);
      }
    });
  };

  return service;
}]);
