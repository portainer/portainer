angular.module('portainer.registrymanagement', []).config([
  '$stateRegistryProvider',
  function ($stateRegistryProvider) {
    'use strict';

    var registryConfiguration = {
      name: 'portainer.registries.registry.configure',
      url: '/configure',
      views: {
        'content@': {
          component: 'configureRegistryView',
        },
      },
    };

    var registryRepositories = {
      name: 'portainer.registries.registry.repositories',
      url: '/repositories',
      views: {
        'content@': {
          component: 'registryRepositoriesView',
        },
      },
    };

    var registryRepositoryTags = {
      name: 'portainer.registries.registry.repository',
      url: '/:repository',
      views: {
        'content@': {
          templateUrl: './views/repositories/edit/template.html',
          controller: 'RegistryRepositoryController',
        },
      },
    };
    var registryRepositoryTag = {
      name: 'portainer.registries.registry.repository.tag',
      url: '/:tag',
      views: {
        'content@': {
          component: 'registryRepositoryTagView',
        },
      },
    };

    $stateRegistryProvider.register(registryConfiguration);
    $stateRegistryProvider.register(registryRepositories);
    $stateRegistryProvider.register(registryRepositoryTags);
    $stateRegistryProvider.register(registryRepositoryTag);
  },
]);
