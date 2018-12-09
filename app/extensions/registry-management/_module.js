angular.module('portainer.extensions.registrymanagement', [])
.config(['$stateRegistryProvider', function ($stateRegistryProvider) {
  'use strict';

  var registryConfiguration = {
    name: 'portainer.registries.registry.configure',
    url: '/configure',
    views: {
      'content@': {
        templateUrl: './views/configure/configureregistry.html',
        controller: 'ConfigureRegistryController'
      }
    }
  };

  var registryRepositories = {
    name: 'portainer.registries.registry.repositories',
    url: '/repositories',
    views: {
      'content@': {
        templateUrl: './views/repositories/registryRepositories.html',
        controller: 'RegistryRepositoriesController'
      }
    }
  };

  var registryRepositoryTags = {
    name: 'portainer.registries.registry.repository',
    url: '/:repository',
    views: {
      'content@': {
        templateUrl: './views/repositories/edit/registryRepository.html',
        controller: 'RegistryRepositoryController'
      }
    }
  };

  $stateRegistryProvider.register(registryConfiguration);
  $stateRegistryProvider.register(registryRepositories);
  $stateRegistryProvider.register(registryRepositoryTags);
}]);
