import angular from 'angular';

angular.module('portainer.edge', []).config(function config($stateRegistryProvider) {
  const edge = {
    name: 'edge',
    url: '/edge',
    parent: 'root',
    abstract: true,
    onEnter($state, Notifications, Authentication) {
      if (!Authentication.isAdmin()) {
        Notifications.warning('User is not authorized');
        $state.go('portainer.home');
      }
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
  };

  $stateRegistryProvider.register(edge);
  $stateRegistryProvider.register(groups);
});
