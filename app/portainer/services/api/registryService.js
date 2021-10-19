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
      retrievePorRegistryModelFromRepositoryWithRegistries,
      loadRegistriesForDropdown,
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

    // findBestMatchRegistry finds out the best match registry for repository
    // matching precedence:
    // 1. registryId matched
    // 2. both domain name and username matched (for dockerhub only)
    // 3. only URL matched
    // 4. pick up the first dockerhub registry
    function findBestMatchRegistry(repository, registries, registryId) {
      let match2, match3, match4;

      for (const registry of registries) {
        if (registry.Id == registryId) {
          return registry;
        }

        if (registry.Type === RegistryTypes.DOCKERHUB) {
          // try to match repository examples:
          //   <USERNAME>/nginx:latest
          //   docker.io/<USERNAME>/nginx:latest
          if (repository.startsWith(registry.Username + '/') || repository.startsWith(getURL(registry) + '/' + registry.Username + '/')) {
            match2 = registry;
          }

          // try to match repository examples:
          //   portainer/portainer-ee:latest
          //   <NON-USERNAME>/portainer-ee:latest
          match4 = match4 || registry;
        }

        if (_.includes(repository, getURL(registry))) {
          match3 = registry;
        }
      }

      return match2 || match3 || match4;
    }

    function retrievePorRegistryModelFromRepositoryWithRegistries(repository, registries, registryId) {
      const model = new PorImageRegistryModel();
      const registry = findBestMatchRegistry(repository, registries, registryId);
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

    function loadRegistriesForDropdown(endpointId, namespace) {
      return $async(async () => {
        try {
          const registries = await EndpointService.registries(endpointId, namespace);

          // hide default(anonymous) dockerhub registry if user has an authenticated one
          if (!registries.some((registry) => registry.Type === RegistryTypes.DOCKERHUB)) {
            registries.push(new DockerHubViewModel());
          }

          return registries;
        } catch (err) {
          throw { msg: 'Unable to retrieve the registries', err: err };
        }
      });
    }
  },
]);
