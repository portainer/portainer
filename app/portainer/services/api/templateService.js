import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { DockerHubViewModel } from 'Portainer/models/dockerhub';

angular.module('portainer.app').factory('TemplateService', TemplateServiceFactory);

/* @ngInject */
function TemplateServiceFactory($q, Templates, EndpointService) {
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

  return service;
}
