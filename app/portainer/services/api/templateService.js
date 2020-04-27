import _ from 'lodash-es';
import { TemplateViewModel } from '../../models/template';

angular.module('portainer.app').factory('TemplateService', [
  '$q',
  'Templates',
  'TemplateHelper',
  'RegistryService',
  'DockerHubService',
  'ImageHelper',
  'ContainerHelper',
  function TemplateServiceFactory($q, Templates, TemplateHelper, RegistryService, DockerHubService, ImageHelper, ContainerHelper) {
    'use strict';
    var service = {};

    service.templates = function () {
      const deferred = $q.defer();

      $q.all({
        templates: Templates.query().$promise,
        registries: RegistryService.registries(),
        dockerhub: DockerHubService.dockerhub(),
      })
        .then(function success(data) {
          const version = data.templates.version;
          const templates = _.map(data.templates.templates, (item) => {
            try {
              const template = new TemplateViewModel(item, version);
              const registry = RegistryService.retrievePorRegistryModelFromRepositoryWithRegistries(template.RegistryModel.Registry.URL, data.registries, data.dockerhub);
              registry.Image = template.RegistryModel.Image;
              template.RegistryModel = registry;
              return template;
            } catch (err) {
              deferred.reject({ msg: 'Unable to retrieve templates', err: err });
            }
          });
          deferred.resolve(templates);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve templates', err: err });
        });

      return deferred.promise;
    };

    service.createTemplateConfiguration = function (template, containerName, network) {
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
      return configuration;
    }

    service.updateContainerConfigurationWithVolumes = function (configuration, template, generatedVolumesPile) {
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
  },
]);
