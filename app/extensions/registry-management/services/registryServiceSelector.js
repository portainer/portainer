const RegistryTypes = Object.freeze({
  'QUAY': 1,
  'AZURE': 2,
  'CUSTOM': 3,
  'GITLAB': 5
})

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
  // service.deleteTag = deleteTag;

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
      service = RegistryGitlabService;
    }
    return service.deleteManifest(registry, repository, digest);
  }

  // function deleteTag(registry) {
  //   let service = RegistryAPIV2Service;
  //   if (registry.Type === RegistryTypes.GITLAB) {
  //     service = RegistryGitlabService;
  //   }
  //   return service.deleteTag();
  // }

  return service;
}
]);
