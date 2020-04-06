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
          component: 'edgeGroupsView'
        }
      }
    };

    const groupsNew = {
      name: 'edge.groups.new',
      url: '/new',
      views: {
        'content@': {
          component: 'createEdgeGroupView'
        }
      }
    };

    const groupsEdit = {
      name: 'edge.groups.edit',
      url: '/:groupId',
      views: {
        'content@': {
          component: 'editEdgeGroupView'
        }
      }
    };

    $stateRegistryProvider.register(edge);
    $stateRegistryProvider.register(groups);
    $stateRegistryProvider.register(groupsNew);
    $stateRegistryProvider.register(groupsEdit);
  }
);
