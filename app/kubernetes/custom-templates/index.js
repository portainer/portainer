import angular from 'angular';

import { kubeCustomTemplatesView } from './kube-custom-templates-view';
import { kubeEditCustomTemplateView } from './kube-edit-custom-template-view';
import { kubeCreateCustomTemplateView } from './kube-create-custom-template-view';

export default angular
  .module('portainer.kubernetes.custom-templates', [])
  .config(config)
  .component('kubeCustomTemplatesView', kubeCustomTemplatesView)
  .component('kubeEditCustomTemplateView', kubeEditCustomTemplateView)
  .component('kubeCreateCustomTemplateView', kubeCreateCustomTemplateView).name;

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
        component: 'kubeCustomTemplatesView',
      },
    },
  };

  const customTemplatesNew = {
    name: 'kubernetes.templates.custom.new',
    url: '/new?fileContent',

    views: {
      'content@': {
        component: 'kubeCreateCustomTemplateView',
      },
    },
    params: {
      fileContent: '',
    },
  };

  const customTemplatesEdit = {
    name: 'kubernetes.templates.custom.edit',
    url: '/:id',

    views: {
      'content@': {
        component: 'kubeEditCustomTemplateView',
      },
    },
  };

  $stateRegistryProvider.register(templates);
  $stateRegistryProvider.register(customTemplates);
  $stateRegistryProvider.register(customTemplatesNew);
  $stateRegistryProvider.register(customTemplatesEdit);
}
