import angular from 'angular';

import edgeStackModule from './views/edge-stacks';
import { reactModule } from './react';

angular
  .module('portainer.edge', [edgeStackModule, reactModule])

  .config(function config($stateRegistryProvider) {
    const edge = {
      name: 'edge',
      url: '/edge',
      parent: 'root',
      abstract: true,
    };

    const groups = {
      name: 'edge.groups',
      url: '/groups',
      views: {
        'content@': {
          component: 'edgeGroupsView',
        },
      },
    };

    const groupsNew = {
      name: 'edge.groups.new',
      url: '/new',
      views: {
        'content@': {
          component: 'createEdgeGroupView',
        },
      },
    };

    const groupsEdit = {
      name: 'edge.groups.edit',
      url: '/:groupId',
      views: {
        'content@': {
          component: 'editEdgeGroupView',
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
    };

    const stacksNew = {
      name: 'edge.stacks.new',
      url: '/new',
      views: {
        'content@': {
          component: 'createEdgeStackView',
        },
      },
    };

    const stacksEdit = {
      name: 'edge.stacks.edit',
      url: '/:stackId?tab&status',
      views: {
        'content@': {
          component: 'editEdgeStackView',
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
    };

    const edgeJob = {
      name: 'edge.jobs.job',
      url: '/:id',
      views: {
        'content@': {
          component: 'edgeJobView',
        },
      },
      params: {
        tab: 0,
      },
    };

    const edgeJobCreation = {
      name: 'edge.jobs.new',
      url: '/new',
      views: {
        'content@': {
          component: 'createEdgeJobView',
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
      });
    }

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
