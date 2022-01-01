import { DockerHubViewModel } from 'Portainer/models/dockerhub';
import { TemplateViewModel } from '../../models/template';

angular.module('portainer.app').factory('TemplateService', TemplateServiceFactory);

/* @ngInject */
function TemplateServiceFactory($q, Templates, TemplateHelper, ImageHelper, ContainerHelper, EndpointService) {
  var service = {
    templates,
  };

  function templates(endpointId) {
    const deferred = $q.defer();

    $q.all({
      templates: Templates.query().$promise,
      registries: EndpointService.registries(endpointId),
    })
      .then(function success({ templates, registries }) {
        const version = templates.version;
        deferred.resolve(
          templates.templates.map((item) => {
            try {
              const template = new TemplateViewModel(item, version);
              const registryURL = template.RegistryModel.Registry.URL;
              const registry = registryURL ? registries.find((reg) => reg.URL === registryURL) : new DockerHubViewModel();
              template.RegistryModel.Registry = registry;
              return template;
            } catch (err) {
              deferred.reject({ msg: 'Unable to retrieve templates', err: err });
            }
          })
        );
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve templates', err: err });
      });

    return deferred.promise;
  }

  service.templateFile = templateFile;
  function templateFile(repositoryUrl, composeFilePathInRepository) {
    return Templates.file({ repositoryUrl, composeFilePathInRepository }).$promise;
  }

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
}
