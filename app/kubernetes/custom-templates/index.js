import angular from 'angular';

export default angular.module('portainer.kubernetes.custom-templates', []).config(config).name;

function config($stateRegistryProvider) {
  const templates = {
    name: 'kubernetes.templates',
    url: '/templates',
    abstract: true,
  };

  const customTemplates = {
    name: 'kubernetes.templates.custom',
    url: '/custom',

    views: {
      'content@': {
        component: 'customTemplatesView',
      },
    },
    data: {
      docs: '/user/kubernetes/templates',
    },
  };

  const customTemplatesNew = {
    name: 'kubernetes.templates.custom.new',
    url: '/new?fileContent',

    views: {
      'content@': {
        component: 'createCustomTemplatesView',
      },
    },
    params: {
      fileContent: '',
    },
    data: {
      docs: '/user/kubernetes/templates/add',
    },
  };

  const customTemplatesEdit = {
    name: 'kubernetes.templates.custom.edit',
    url: '/:id',

    views: {
      'content@': {
        component: 'editCustomTemplatesView',
      },
    },
  };

  $stateRegistryProvider.register(templates);
  $stateRegistryProvider.register(customTemplates);
  $stateRegistryProvider.register(customTemplatesNew);
  $stateRegistryProvider.register(customTemplatesEdit);
}
