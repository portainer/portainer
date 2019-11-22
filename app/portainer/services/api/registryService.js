import _ from 'lodash-es';
import { RegistryViewModel, RegistryCreateRequest } from '../../models/registry';
import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';

angular.module('portainer.app')
.factory('RegistryService', ['$q', '$async', 'Registries', 'DockerHubService', 'ImageHelper', 'FileUploadService',
function RegistryServiceFactory($q, $async, Registries, DockerHubService, ImageHelper, FileUploadService) {
  'use strict';
  var service = {};

  service.registries = function() {
    var deferred = $q.defer();

    Registries.query().$promise
    .then(function success(data) {
      var registries = data.map(function (item) {
        return new RegistryViewModel(item);
      });
      deferred.resolve(registries);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve registries', err: err});
    });

    return deferred.promise;
  };

  service.registry = function(id) {
    var deferred = $q.defer();

    Registries.get({id: id}).$promise
    .then(function success(data) {
      var registry = new RegistryViewModel(data);
      deferred.resolve(registry);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve registry details', err: err});
    });

    return deferred.promise;
  };

  service.encodedCredentials = function(registry) {
    var credentials = {
      serveraddress: registry.URL
    };
    return btoa(JSON.stringify(credentials));
  };

  service.updateAccess = function(id, userAccessPolicies, teamAccessPolicies) {
    return Registries.updateAccess({id: id}, {UserAccessPolicies: userAccessPolicies, TeamAccessPolicies: teamAccessPolicies}).$promise;
  };

  service.deleteRegistry = function(id) {
    return Registries.remove({id: id}).$promise;
  };

  service.updateRegistry = function(registry) {
    return Registries.update({ id: registry.Id }, registry).$promise;
  };

  service.configureRegistry = function(id, registryManagementConfigurationModel) {
    return FileUploadService.configureRegistry(id, registryManagementConfigurationModel);
  };

  service.createRegistry = function(model) {
    var payload = new RegistryCreateRequest(model);
    return Registries.create(payload).$promise;
  };

  service.createGitlabRegistries = function(model, projects) {
    const promises = [];
    _.forEach(projects, (p) => {
      const m = model;
      m.Name = p.PathWithNamespace;
      m.Gitlab.ProjectId = p.Id;
      m.Password = m.Token;
      const payload = new RegistryCreateRequest(m);
      promises.push(Registries.create(payload).$promise);
    });
    return $q.all(promises);
  };

  service.retrievePorRegistryModelFromRepositoryWithRegistries = retrievePorRegistryModelFromRepositoryWithRegistries;

  function retrievePorRegistryModelFromRepositoryWithRegistries(repository, registries) {
    const model = new PorImageRegistryModel();
    const registry = _.find(registries, (reg) => _.includes(repository, reg.URL));
    if (registry) {
      const lastIndex = repository.lastIndexOf(registry.URL) + registry.URL.length;
      const image = repository.substring(lastIndex + 1);
      model.Registry = registry;
      model.Image = image;
    } else {
      model.UseRegistry = false;
      model.Image = repository;
    }
    return model;
  }

  async function retrievePorRegistryModelFromRepositoryAsync(repository) {
    try {
      const [registries, dockerhub] = await Promise.all([
        service.registries(),
        DockerHubService.dockerhub()
      ]);
      registries.concat([dockerhub]);
      return retrievePorRegistryModelFromRepositoryWithRegistries(repository, registries);
    } catch (err) {
      throw { msg: 'Unable to retrieve the registry associated to the repository', err: err }
    }
  }

  service.retrievePorRegistryModelFromRepository = function(repository) {
    return $async(retrievePorRegistryModelFromRepositoryAsync, repository)
  };

  return service;
}]);
