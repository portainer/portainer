import { AccessHeaders } from '../authorization-guard';

angular.module('portainer.registrymanagement', []).config(config);

/* @ngInject */
function config($stateRegistryProvider) {
  const registries = {
    name: 'portainer.registries',
    url: '/registries',
    views: {
      'content@': {
        component: 'registriesView',
      },
    },
    data: {
      docs: '/admin/registries',
      access: AccessHeaders.Admin,
    },
  };

  const registryCreation = {
    name: 'portainer.registries.new',
    url: '/new',
    views: {
      'content@': {
        component: 'createRegistry',
      },
    },
    data: {
      docs: '/admin/registries/add',
    },
  };

  const registry = {
    name: 'portainer.registries.registry',
    url: '/:id',
    views: {
      'content@': {
        component: 'editRegistry',
      },
    },
    data: {
      docs: '/admin/registries/edit',
    },
  };

  $stateRegistryProvider.register(registries);
  $stateRegistryProvider.register(registry);
  $stateRegistryProvider.register(registryCreation);
}
