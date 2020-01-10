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

  var applications = {
    name: 'kubernetes.applications',
    url: '/applications',
    // views: {
    //   'content@': {
    //     templateUrl: './views/applications/applications.html',
    //     controller: 'KubernetesApplicationsController',
    //     controllerAs: 'ctrl'
    //   }
    // }
  };

  const applicationCreateMockup = {
    name: 'kubernetes.applications.mockup1',
    url: '/mockup1',
    views: {
      'content@': {
        templateUrl: './views/applications/create/mockup.html',
        // controller: 'KubernetesCreateApplicationController',
        // controllerAs: 'ctrl'
      }
    }
  };

  const applicationCreateMockupExpanded = {
    name: 'kubernetes.applications.mockup2',
    url: '/mockup2',
    views: {
      'content@': {
        templateUrl: './views/applications/create/mockup-expanded.html',
        // controller: 'KubernetesCreateApplicationController',
        // controllerAs: 'ctrl'
      }
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

  const nodes = {
    name: 'kubernetes.cluster',
    url: '/cluster',
    views: {
      'content@': {
        templateUrl: './views/cluster/cluster.html',
        controller: 'KubernetesClusterController',
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

  const resourcePoolCreation = {
    name: 'kubernetes.resourcePools.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: './views/resource-pools/create/createResourcePool.html',
        controller: 'KubernetesCreateResourcePoolController',
        controllerAs: 'ctrl'
      }	
    }	
  };

  $stateRegistryProvider.register(kubernetes);
  $stateRegistryProvider.register(applications);
  $stateRegistryProvider.register(applicationCreateMockup);
  $stateRegistryProvider.register(applicationCreateMockupExpanded);
  $stateRegistryProvider.register(dashboard);
  $stateRegistryProvider.register(nodes);
  $stateRegistryProvider.register(resourcePools);
  $stateRegistryProvider.register(resourcePoolCreation);
}]);
