import angular from 'angular';

import { AccessHeaders } from '@/portainer/authorization-guard';
import { reactModule } from './react';

angular
  .module('portainer.edge', [reactModule])

  .config(function config($stateRegistryProvider) {
    const edge = {
      name: 'edge',
      url: '/edge',
      parent: 'root',
      abstract: true,
      data: {
        access: AccessHeaders.EdgeAdmin,
      },
    };

    const groups = {
      name: 'edge.groups',
      url: '/groups',
      views: {
        'content@': {
          component: 'edgeGroupsView',
        },
      },
      data: {
        docs: '/user/edge/groups',
      },
    };

    const groupsNew = {
      name: 'edge.groups.new',
      url: '/new',
      views: {
        'content@': {
          component: 'edgeGroupsCreateView',
        },
      },
    };

    const groupsEdit = {
      name: 'edge.groups.edit',
      url: '/:groupId',
      views: {
        'content@': {
          component: 'edgeGroupsItemView',
        },
      },
    };

    const stacks = {
      name: 'edge.stacks',
      url: '/stacks',
      views: {
        'content@': {
          component: 'edgeStacksView',
        },
      },
      data: {
        docs: '/user/edge/stacks',
      },
    };

    const stacksNew = {
      name: 'edge.stacks.new',
      url: '/new?templateId&templateType',
      views: {
        'content@': {
          component: 'edgeStacksCreateView',
        },
      },
      data: {
        docs: '/user/edge/stacks/add',
      },
      params: {
        templateId: { dynamic: true },
        templateType: { dynamic: true },
      },
    };

    const stacksEdit = {
      name: 'edge.stacks.edit',
      url: '/:stackId?tab&status',
      views: {
        'content@': {
          component: 'edgeStacksItemView',
        },
      },
      params: {
        status: {
          dynamic: true,
        },
      },
    };

    const edgeJobs = {
      name: 'edge.jobs',
      url: '/jobs',
      views: {
        'content@': {
          component: 'edgeJobsView',
        },
      },
      data: {
        docs: '/user/edge/jobs',
      },
    };

    const edgeJob = {
      name: 'edge.jobs.job',
      url: '/:id?tab',
      views: {
        'content@': {
          component: 'edgeJobsItemView',
        },
      },
    };

    const edgeJobCreation = {
      name: 'edge.jobs.new',
      url: '/new',
      views: {
        'content@': {
          component: 'edgeJobsCreateView',
        },
      },
    };

    $stateRegistryProvider.register({
      name: 'edge.devices',
      url: '/devices',
      abstract: true,
    });

    if (process.env.PORTAINER_EDITION === 'BE') {
      $stateRegistryProvider.register({
        name: 'edge.devices.waiting-room',
        url: '/waiting-room',
        views: {
          'content@': {
            component: 'waitingRoomView',
          },
        },
        data: {
          docs: '/user/edge/waiting-room',
        },
      });
    }

    $stateRegistryProvider.register({
      name: 'edge.templates',
      url: '/templates?template',
      views: {
        'content@': {
          component: 'appTemplatesView',
        },
      },
      data: {
        docs: '/user/edge/templates/application',
      },
    });

    $stateRegistryProvider.register({
      name: 'edge.templates.custom',
      url: '/custom',
      views: {
        'content@': {
          component: 'customTemplatesView',
        },
      },
      data: {
        docs: '/user/edge/templates/custom',
      },
    });

    $stateRegistryProvider.register({
      name: 'edge.templates.custom.new',
      url: '/new?appTemplateId&type',

      views: {
        'content@': {
          component: 'createCustomTemplatesView',
        },
      },
    });

    $stateRegistryProvider.register({
      name: 'edge.templates.custom.edit',
      url: '/:id',

      views: {
        'content@': {
          component: 'editCustomTemplatesView',
        },
      },
    });

    $stateRegistryProvider.register(edge);

    $stateRegistryProvider.register(groups);
    $stateRegistryProvider.register(groupsNew);
    $stateRegistryProvider.register(groupsEdit);

    $stateRegistryProvider.register(stacks);
    $stateRegistryProvider.register(stacksNew);
    $stateRegistryProvider.register(stacksEdit);

    $stateRegistryProvider.register(edgeJobs);
    $stateRegistryProvider.register(edgeJob);
    $stateRegistryProvider.register(edgeJobCreation);
  });
