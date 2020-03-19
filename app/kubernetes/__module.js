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
        component: 'kubernetesApplicationsView'
      }
    }
  };

  const applicationCreation = {
    name: 'kubernetes.applications.new',
    url: '/new',
    views: {
      'content@': {
        component: 'kubernetesCreateApplicationView'
      }
    }
  };

  const application = {
    name: 'kubernetes.applications.application',
    url: '/:namespace/:name',
    views: {
      'content@': {
        component: 'kubernetesApplicationView'
      }
    }
  };

  const applicationConsole = {
    name: 'kubernetes.applications.application.console',
    url: '/:pod/console',
    views: {
      'content@': {
        component: 'kubernetesApplicationConsoleView'
      }
    }
  };

  const applicationLogs = {
    name: 'kubernetes.applications.application.logs',
    url: '/:pod/logs',
    views: {
      'content@': {
        component: 'kubernetesApplicationLogsView'
      }
    }
  };

  const configurations = {
    name: 'kubernetes.configurations',
    url: '/configurations',
    views: {
      'content@': {
        component: 'kubernetesConfigurationsView'
      }
    }
  };

  const configurationCreation = {
    name: 'kubernetes.configurations.new',
    url: '/new',
    views: {
      'content@': {
        component: 'kubernetesCreateConfigurationView'
      }
    }
  };

  const configuration = {
    name: 'kubernetes.configurations.configuration',
    url: '/:namespace/:name',
    views: {
      'content@': {
        component: 'kubernetesConfigurationView'
      }
    }
  };

  const cluster = {
    name: 'kubernetes.cluster',
    url: '/cluster',
    views: {
      'content@': {
        component: 'kubernetesClusterView'
      }
    }
  };

  const node = {
    name: 'kubernetes.cluster.node',
    url: '/:name',
    views: {
      'content@': {
        component: 'kubernetesNodeView'
      }
    }
  };

  const dashboard = {
    name: 'kubernetes.dashboard',
    url: '/dashboard',
    views: {
      'content@': {
        component: 'kubernetesDashboardView'
      }
    }
  };

  const deploy = {
    name: 'kubernetes.deploy',
    url: '/deploy',
    views: {
      'content@': {
        component: 'kubernetesDeployView'
      }
    }
  };

  const resourcePools = {
    name: 'kubernetes.resourcePools',
    url: '/pools',
    views: {
      'content@': {
        component: 'kubernetesResourcePoolsView'
      }
    }
  };

  const resourcePoolCreation = {
    name: 'kubernetes.resourcePools.new',
    url: '/new',
    views: {
      'content@': {
        component: 'kubernetesCreateResourcePoolView'
      }
    }
  };

  const resourcePool = {
    name: 'kubernetes.resourcePools.resourcePool',
    url: '/:id',
    views: {
      'content@': {
        component: 'kubernetesResourcePoolView'
      }
    }
  };

  const resourcePoolAccess = {
    name: 'kubernetes.resourcePools.resourcePool.access',
    url: '/access',
    views: {
      'content@': {
        component: 'kubernetesResourcePoolAccessView'
      }
    }
  };

  const volumes = {
    name: 'kubernetes.volumes',
    url: '/volumes',
    views: {
      'content@': {
        component: 'kubernetesVolumesView'
      }
    }
  };

  $stateRegistryProvider.register(kubernetes);
  $stateRegistryProvider.register(applications);
  $stateRegistryProvider.register(applicationCreation);
  $stateRegistryProvider.register(application);
  $stateRegistryProvider.register(applicationConsole);
  $stateRegistryProvider.register(applicationLogs);
  $stateRegistryProvider.register(configurations);
  $stateRegistryProvider.register(configurationCreation);
  $stateRegistryProvider.register(configuration);
  $stateRegistryProvider.register(cluster);
  $stateRegistryProvider.register(dashboard);
  $stateRegistryProvider.register(deploy);
  $stateRegistryProvider.register(node);
  $stateRegistryProvider.register(resourcePools);
  $stateRegistryProvider.register(resourcePoolCreation);
  $stateRegistryProvider.register(resourcePool);
  $stateRegistryProvider.register(resourcePoolAccess);
  $stateRegistryProvider.register(volumes);
}]);
