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

  const applications = {
    name: 'kubernetes.applications',
    url: '/applications',
    views: {
      'content@': {
        templateUrl: './views/applications/applications.html',
        controller: 'KubernetesApplicationsController',
        controllerAs: 'ctrl'
      }
    }
  };

  const applicationCreation = {
    name: 'kubernetes.applications.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: './views/applications/create/createApplication.html',
        controller: 'KubernetesCreateApplicationController',
        controllerAs: 'ctrl'
      }
    }
  };

  const application = {
    name: 'kubernetes.applications.application',
    url: '/:namespace/:name',
    views: {
      'content@': {
        templateUrl: './views/applications/inspect/application.html',
        controller: 'KubernetesApplicationController',
        controllerAs: 'ctrl'
      }
    }
  };

  const applicationConsole = {
    name: 'kubernetes.applications.application.console',
    url: '/:pod/console',
    views: {
      'content@': {
        templateUrl: './views/applications/console/console.html',
        controller: 'KubernetesApplicationConsoleController',
        controllerAs: 'ctrl'
      }
    }
  };

  const applicationLogs = {
    name: 'kubernetes.applications.application.logs',
    url: '/:pod/logs',
    views: {
      'content@': {
        templateUrl: './views/applications/logs/logs.html',
        controller: 'KubernetesApplicationLogsController',
        controllerAs: 'ctrl'
      }
    }
  };

  const applicationCreateMockup = {
    name: 'kubernetes.applications.mockup1',
    url: '/mockup1',
    views: {
      'content@': {
        templateUrl: './views/applications/create/mockup.html'
      }
    }
  };

  const applicationCreateMockupExpanded = {
    name: 'kubernetes.applications.mockup2',
    url: '/mockup2',
    views: {
      'content@': {
        templateUrl: './views/applications/create/mockup-expanded.html'
      }
    }
  };

  const cluster = {
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

  const node = {
    name: 'kubernetes.cluster.node',
    url: '/:name',
    views: {
      'content@': {
        templateUrl: './views/cluster/node/node.html',
        controller: 'KubernetesNodeController',
        controllerAs: 'ctrl'
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

  const deploy = {
    name: 'kubernetes.deploy',
    url: '/deploy',
    views: {
      'content@': {
        templateUrl: './views/deploy/deploy.html',
        controller: 'KubernetesDeployController',
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

  const resourcePool = {
    name: 'kubernetes.resourcePools.resourcePool',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: './views/resource-pools/edit/resourcePool.html',
        controller: 'KubernetesEditResourcePoolController',
        controllerAs: 'ctrl'
      }
    }
  };

  const resourcePoolAccess = {
    name: 'kubernetes.resourcePools.resourcePool.access',
    url: '/access',
    views: {
      'content@': {
        templateUrl: './views/resource-pools/access/resourcePoolAccess.html',
        controller: 'KubernetesResourcePoolAccessController',
        controllerAs: 'ctrl'
      }
    }
  };

  const stacks = {
    name: 'kubernetes.stacks',
    url: '/stacks',
    views: {
      'content@': {
        templateUrl: './views/stacks/stacks.html',
        controller: 'KubernetesStacksController',
        controllerAs: 'ctrl'
      }
    }
  };

  $stateRegistryProvider.register(kubernetes);
  $stateRegistryProvider.register(applications);
  $stateRegistryProvider.register(applicationCreation);
  $stateRegistryProvider.register(application);
  $stateRegistryProvider.register(applicationConsole);
  $stateRegistryProvider.register(applicationLogs);
  $stateRegistryProvider.register(applicationCreateMockup);
  $stateRegistryProvider.register(applicationCreateMockupExpanded);
  $stateRegistryProvider.register(cluster);
  $stateRegistryProvider.register(dashboard);
  $stateRegistryProvider.register(deploy);
  $stateRegistryProvider.register(node);
  $stateRegistryProvider.register(resourcePools);
  $stateRegistryProvider.register(resourcePoolCreation);
  $stateRegistryProvider.register(resourcePool);
  $stateRegistryProvider.register(resourcePoolAccess);
  $stateRegistryProvider.register(stacks);
}]);
