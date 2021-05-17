import _ from 'lodash-es';
import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';
import { RegistryTypes } from 'Portainer/models/registryTypes';
import { RegistryCreateRequest, RegistryViewModel } from 'Portainer/models/registry';
import { DockerHubViewModel } from 'Portainer/models/dockerhub';

angular.module('portainer.app').factory('RegistryService', [
  '$q',
  '$async',
  'EndpointService',
  'Registries',
  'ImageHelper',
  'FileUploadService',
  function RegistryServiceFactory($q, $async, EndpointService, Registries, ImageHelper, FileUploadService) {
    return {
      registries,
      registry,
      encodedCredentials,
      deleteRegistry,
      updateRegistry,
      configureRegistry,
      createRegistry,
      createGitlabRegistries,
      retrievePorRegistryModelFromRepository,
    };

    function registries() {
      var deferred = $q.defer();

      Registries.query()
        .$promise.then(function success(data) {
          var registries = data.map(function (item) {
            return new RegistryViewModel(item);
          });
          deferred.resolve(registries);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve registries', err: err });
        });

      return deferred.promise;
    }

    function registry(id, endpointId) {
      var deferred = $q.defer();

      Registries.get({ id, endpointId })
        .$promise.then(function success(data) {
          var registry = new RegistryViewModel(data);
          deferred.resolve(registry);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve registry details', err: err });
        });

      return deferred.promise;
    }

    function encodedCredentials(registry) {
      var credentials = {
        registryId: registry.Id,
      };
      return btoa(JSON.stringify(credentials));
    }

    function deleteRegistry(id) {
      return Registries.remove({ id: id }).$promise;
    }

    function updateRegistry(registry) {
      registry.URL = _.replace(registry.URL, /^https?\:\/\//i, '');
      registry.URL = _.replace(registry.URL, /\/$/, '');
      return Registries.update({ id: registry.Id }, registry).$promise;
    }

    function configureRegistry(id, registryManagementConfigurationModel) {
      return FileUploadService.configureRegistry(id, registryManagementConfigurationModel);
    }

    function createRegistry(model) {
      var payload = new RegistryCreateRequest(model);
      return Registries.create(payload).$promise;
    }

    function createGitlabRegistries(model, projects) {
      const promises = [];
      _.forEach(projects, (p) => {
        const m = model;
        m.Name = p.PathWithNamespace;
        m.Gitlab.ProjectPath = _.toLower(p.PathWithNamespace);
        m.Gitlab.ProjectId = p.Id;
        m.Password = m.Token;
        const payload = new RegistryCreateRequest(m);
        promises.push(Registries.create(payload).$promise);
      });
      return $q.all(promises);
    }

    function getURL(reg) {
      let url = reg.URL;
      if (reg.Type === RegistryTypes.GITLAB) {
        url = reg.URL + '/' + reg.Gitlab.ProjectPath;
      } else if (reg.Type === RegistryTypes.QUAY) {
        const name = reg.Quay.UseOrganisation ? reg.Quay.OrganisationName : reg.Username;
        url = reg.URL + '/' + name;
      }
      return url;
    }

    function retrievePorRegistryModelFromRepositoryWithRegistries(repository, registries, registryId) {
      const model = new PorImageRegistryModel();
      const registry = registries.find((reg) => {
        if (registryId) {
          return reg.Id === registryId;
        }
        if (reg.Type === RegistryTypes.DOCKERHUB) {
          return _.includes(repository, reg.Username);
        }
        return _.includes(repository, getURL(reg));
      });
      if (registry) {
        const url = getURL(registry);
        let lastIndex = repository.lastIndexOf(url);
        lastIndex = lastIndex === -1 ? 0 : lastIndex + url.length;
        let image = repository.substring(lastIndex);
        if (_.startsWith(image, '/')) {
          image = image.substring(1);
        }
        model.Registry = registry;
        model.Image = image;
      } else {
        if (ImageHelper.imageContainsURL(repository)) {
          model.UseRegistry = false;
        }
        model.Registry = new DockerHubViewModel();
        model.Image = repository;
      }
      return model;
    }

    function retrievePorRegistryModelFromRepository(repository, endpointId, registryId, namespace) {
      return $async(async () => {
        try {
          const regs = await EndpointService.registries(endpointId, namespace);
          return retrievePorRegistryModelFromRepositoryWithRegistries(repository, regs, registryId);
        } catch (err) {
          throw { msg: 'Unable to retrieve the registry associated to the repository', err: err };
        }
      });
    }
  },
]);
