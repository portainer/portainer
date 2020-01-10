angular.module('portainer.kubernetes', ['portainer.app'])
.config(['$stateRegistryProvider', function ($stateRegistryProvider) {
  'use strict';

  const kubernetes = {
    name: 'kubernetes',
    url: '/kubernetes',
    parent: 'root',
    abstract: true,
    resolve: {
      endpointID: ['EndpointProvider', '$state',
        function (EndpointProvider, $state) {
          const id = EndpointProvider.endpointID();
          if (!id) {
            return $state.go('portainer.home');
          }
        }
      ]
    }
  };

  const dashboard = {
    name: 'kubernetes.dashboard',
    url: '/dashboard',
    views: {
      'content@': {
        templateUrl: './views/dashboard/dashboard.html',
        controller: 'KubernetesDashboardController',
        controllerAs: 'ctrl'
      }
    }
  };

  const resourcePools = {
    name: 'kubernetes.resourcePools',
    url: '/pools',
    views: {
      'content@': {
        templateUrl: './views/resource-pools/resourcePools.html',
        controller: 'KubernetesResourcePoolsController',
        controllerAs: 'ctrl'
      }	
    }	
  };

  const nodes = {
    name: 'kubernetes.nodes',
    url: '/nodes',
    views: {
      'content@': {
        templateUrl: './views/nodes/nodes.html',
        controller: 'KubernetesNodesController',
        controllerAs: 'ctrl'
      }
    }
  };

  $stateRegistryProvider.register(kubernetes);
  $stateRegistryProvider.register(dashboard);
  $stateRegistryProvider.register(resourcePools);
  $stateRegistryProvider.register(nodes);
}]);
