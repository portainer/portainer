import angular from 'angular';

angular.module('portainer.edge', []).config(function config($stateRegistryProvider) {
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
    url: '/:stackId',
    views: {
      'content@': {
        component: 'editEdgeStackView',
      },
    },
    params: {
      tab: 0,
    },
  };

  var edgeJobs = {
    name: 'edge.jobs',
    url: '/edgeJobs',
    views: {
      'content@': {
        templateUrl: './views/edge-jobs/edgeJobs.html',
        controller: 'EdgeJobsController',
      },
    },
  };

  var edgeJob = {
    name: 'edge.jobs.job',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: './views/edge-jobs/edit/edgeJob.html',
        controller: 'EdgeJobController',
      },
    },
  };

  var edgeJobCreation = {
    name: 'edge.jobs.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: './views/edge-jobs/create/createEdgeJob.html',
        controller: 'CreateEdgeJobController',
      },
    },
  };

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
