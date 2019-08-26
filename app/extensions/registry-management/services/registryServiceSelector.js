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

  function ping(registry, forceNewConfig) {
    let service = RegistryAPIV2Service;
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
    return service.tags(registry, repository);
  }

  function tag(registry, repository, tag) {
    let service = RegistryAPIV2Service;
    return service.tag(registry, repository, tag);
  }

  function addTag(registry, repository, tag, manifest) {
    let service = RegistryAPIV2Service;
    return service.addTag(registry, repository, tag, manifest);
  }

  function deleteManifest(registry, repository, digest) {
    let service = RegistryAPIV2Service;
    return service.deleteManifest(registry, repository, digest);
  }

  return service;
}
]);
