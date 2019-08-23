import { RegistryTypes } from 'Extensions/registry-management/models/registryTypes';

angular.module('portainer.extensions.registrymanagement')
.factory('RegistryServiceSelector', ['$q', 'RegistryAPIV2Service', 'RegistryGitlabService',
function RegistryServiceSelector($q, RegistryAPIV2Service, RegistryGitlabService) {
  'use strict';
  var service = {};

  service.ping = ping;
  service.repositories = repositories;
  service.tags = tags;
  service.tag = tag;
  service.addTag = addTag;
  service.deleteManifest = deleteManifest;
  service.deleteTag = deleteTag;
  service.deleteRepository = deleteRepository;

  function ping(registry, forceNewConfig) {
    let service = RegistryAPIV2Service;
    if (registry.Type === RegistryTypes.GITLAB) {
      service = RegistryGitlabService;
    }
    return service.ping(registry, forceNewConfig)
  }

  function repositories(registry) {
    let service = RegistryAPIV2Service;
    if (registry.Type === RegistryTypes.GITLAB) {
      service = RegistryGitlabService;
    }
    return service.repositories(registry);
  }

  function tags(registry, repository) {
    let service = RegistryAPIV2Service;
    if (registry.Type === RegistryTypes.GITLAB) {
      service = RegistryGitlabService;
    }
    return service.tags(registry, repository);
  }

  function tag(registry, repository, tag) {
    let service = RegistryAPIV2Service;
    if (registry.Type === RegistryTypes.GITLAB) {
      service = RegistryGitlabService;
    }
    return service.tag(registry, repository, tag);
  }

  function addTag(registry, repository, tag, manifest) {
    let service = RegistryAPIV2Service;
    if (registry.Type === RegistryTypes.GITLAB) {
      service = RegistryGitlabService;
    }
    return service.addTag(registry, repository, tag, manifest);
  }

  function deleteManifest(registry, repository, digest) {
    let service = RegistryAPIV2Service;
    if (registry.Type === RegistryTypes.GITLAB) {
      throw {msg: 'Invalid function deleteManifest for gitlab registries'};
    }
    return service.deleteManifest(registry, repository, digest);
  }

  function deleteTag(registry, repository, tag) {
    let service = RegistryGitlabService;
    if (registry.Type === RegistryTypes.GITLAB) {
      return service.deleteTag(registry, repository, tag);
    }
    throw {msg: 'Invalid function deleteTag for non gitlab registries'};
  }

  function deleteRepository(registry, repository) {
    let service = RegistryGitlabService;
    if (registry.Type === RegistryTypes.GITLAB) {
      return service.deleteRepository(registry, repository);
    }
    throw {msg: 'Invalid function deleteRepository for non gitlab registries'};
  }

  return service;
}
]);
