import { RegistryTypes } from 'Extensions/registry-management/models/registryTypes';

angular.module('portainer.extensions.registrymanagement')
.factory('RegistryServiceSelector', ['$q', 'RegistryV2Service', 'RegistryGitlabService',
function RegistryServiceSelector($q, RegistryV2Service, RegistryGitlabService) {
  'use strict';
  const service = {};

  service.ping = ping;
  service.repositories = repositories;
  service.getRepositoriesDetails = getRepositoriesDetails;
  service.tags = tags;
  service.getTagsDetails = getTagsDetails;
  service.tag = tag;
  service.addTag = addTag;
  service.deleteManifest = deleteManifest;

  service.shortTagsWithProgress = shortTagsWithProgress;
  service.deleteTagsWithProgress = deleteTagsWithProgress;
  service.retagWithProgress = retagWithProgress;

  function ping(registry, forceNewConfig) {
    let service = RegistryV2Service;
    return service.ping(registry, forceNewConfig)
  }

  function repositories(registry) {
    let service = RegistryV2Service;
    if (registry.Type === RegistryTypes.GITLAB) {
      service = RegistryGitlabService;
    }
    return service.repositories(registry);
  }

  function getRepositoriesDetails(registry, repositories) {
    let service = RegistryV2Service;
    return service.getRepositoriesDetails(registry, repositories);
  }

  function tags(registry, repository) {
    let service = RegistryV2Service;
    return service.tags(registry, repository);
  }

  function getTagsDetails(registry, repository, tags) {
    let service = RegistryV2Service;
    return service.getTagsDetails(registry, repository, tags);
  }

  function tag(registry, repository, tag) {
    let service = RegistryV2Service;
    return service.tag(registry, repository, tag);
  }

  function addTag(registry, repository, tag, manifest) {
    let service = RegistryV2Service;
    return service.addTag(registry, repository, tag, manifest);
  }

  function deleteManifest(registry, repository, digest) {
    let service = RegistryV2Service;
    return service.deleteManifest(registry, repository, digest);
  }

  function shortTagsWithProgress(registry, repository, tagsList) {
    let service = RegistryV2Service;
    return service.shortTagsWithProgress(registry, repository, tagsList);
  }

  function deleteTagsWithProgress(registry, repository, modifiedDigests, impactedTags) {
    let service = RegistryV2Service;
    return service.deleteTagsWithProgress(registry, repository, modifiedDigests, impactedTags);
  }

  function retagWithProgress(registry, repository, modifiedTags, modifiedDigests, impactedTags) {
    let service = RegistryV2Service;
    return service.retagWithProgress(registry, repository, modifiedTags, modifiedDigests, impactedTags);
  }

  return service;
}
]);
