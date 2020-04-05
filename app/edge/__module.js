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

  $stateRegistryProvider.register(edge);
  $stateRegistryProvider.register(groups);
});
