import registriesModule from './registries';
import customTemplateModule from './custom-templates';

angular.module('portainer.kubernetes', ['portainer.app', registriesModule, customTemplateModule]).config([
  '$stateRegistryProvider',
  function ($stateRegistryProvider) {
    'use strict';

    const kubernetes = {
      name: 'kubernetes',
      url: '/kubernetes',
      parent: 'endpoint',
      abstract: true,

      onEnter: /* @ngInject */ function onEnter($async, $state, endpoint, EndpointProvider, KubernetesHealthService, KubernetesNamespaceService, Notifications, StateManager) {
        return $async(async () => {
          if (![5, 6, 7].includes(endpoint.Type)) {
            $state.go('portainer.home');
            return;
          }
          try {
            if (endpoint.Type === 7) {
              //edge
              try {
                await KubernetesHealthService.ping(endpoint.Id);
                endpoint.Status = 1;
              } catch (e) {
                endpoint.Status = 2;
              }
            }

            EndpointProvider.setEndpointID(endpoint.Id);
            await StateManager.updateEndpointState(endpoint);

            if (endpoint.Type === 7 && endpoint.Status === 2) {
              throw new Error('Unable to contact Edge agent, please ensure that the agent is properly running on the remote environment.');
            }

            await KubernetesNamespaceService.get();
          } catch (e) {
            Notifications.error('Failed loading environment', e);
            $state.go('portainer.home', {}, { reload: true });
          }
        });
      },
    };

    const helmApplication = {
      name: 'kubernetes.helm',
      url: '/helm/:namespace/:name',
      views: {
        'content@': {
          component: 'kubernetesHelmApplicationView',
        },
      },
    };

    const helmTemplates = {
      name: 'kubernetes.templates.helm',
      url: '/helm',
      views: {
        'content@': {
          component: 'helmTemplatesView',
        },
      },
    };

    const applications = {
      name: 'kubernetes.applications',
      url: '/applications',
      views: {
        'content@': {
          component: 'kubernetesApplicationsView',
        },
      },
    };

    const applicationCreation = {
      name: 'kubernetes.applications.new',
      url: '/new',
      views: {
        'content@': {
          component: 'kubernetesCreateApplicationView',
        },
      },
    };

    const application = {
      name: 'kubernetes.applications.application',
      url: '/:namespace/:name',
      views: {
        'content@': {
          component: 'kubernetesApplicationView',
        },
      },
    };

    const applicationEdit = {
      name: 'kubernetes.applications.application.edit',
      url: '/edit',
      views: {
        'content@': {
          component: 'kubernetesCreateApplicationView',
        },
      },
    };

    const applicationConsole = {
      name: 'kubernetes.applications.application.console',
      url: '/:pod/:container/console',
      views: {
        'content@': {
          component: 'kubernetesApplicationConsoleView',
        },
      },
    };

    const applicationLogs = {
      name: 'kubernetes.applications.application.logs',
      url: '/:pod/:container/logs',
      views: {
        'content@': {
          component: 'kubernetesApplicationLogsView',
        },
      },
    };

    const applicationStats = {
      name: 'kubernetes.applications.application.stats',
      url: '/:pod/:container/stats',
      views: {
        'content@': {
          component: 'kubernetesApplicationStatsView',
        },
      },
    };

    const stacks = {
      name: 'kubernetes.stacks',
      url: '/stacks',
      abstract: true,
    };

    const stack = {
      name: 'kubernetes.stacks.stack',
      url: '/:namespace/:name',
      abstract: true,
    };

    const stackLogs = {
      name: 'kubernetes.stacks.stack.logs',
      url: '/logs',
      views: {
        'content@': {
          component: 'kubernetesStackLogsView',
        },
      },
    };

    const configurations = {
      name: 'kubernetes.configurations',
      url: '/configurations',
      views: {
        'content@': {
          component: 'kubernetesConfigurationsView',
        },
      },
    };

    const configurationCreation = {
      name: 'kubernetes.configurations.new',
      url: '/new',
      views: {
        'content@': {
          component: 'kubernetesCreateConfigurationView',
        },
      },
    };

    const configuration = {
      name: 'kubernetes.configurations.configuration',
      url: '/:namespace/:name',
      views: {
        'content@': {
          component: 'kubernetesConfigurationView',
        },
      },
    };

    const cluster = {
      name: 'kubernetes.cluster',
      url: '/cluster',
      views: {
        'content@': {
          component: 'kubernetesClusterView',
        },
      },
    };

    const node = {
      name: 'kubernetes.cluster.node',
      url: '/:name',
      views: {
        'content@': {
          component: 'kubernetesNodeView',
        },
      },
    };

    const nodeStats = {
      name: 'kubernetes.cluster.node.stats',
      url: '/stats',
      views: {
        'content@': {
          component: 'kubernetesNodeStatsView',
        },
      },
    };

    const dashboard = {
      name: 'kubernetes.dashboard',
      url: '/dashboard',
      views: {
        'content@': {
          component: 'kubernetesDashboardView',
        },
      },
    };

    const deploy = {
      name: 'kubernetes.deploy',
      url: '/deploy?templateId',
      views: {
        'content@': {
          component: 'kubernetesDeployView',
        },
      },
      params: {
        templateId: '',
      },
    };

    const resourcePools = {
      name: 'kubernetes.resourcePools',
      url: '/pools',
      views: {
        'content@': {
          component: 'kubernetesResourcePoolsView',
        },
      },
    };

    const resourcePoolCreation = {
      name: 'kubernetes.resourcePools.new',
      url: '/new',
      views: {
        'content@': {
          component: 'kubernetesCreateResourcePoolView',
        },
      },
    };

    const resourcePool = {
      name: 'kubernetes.resourcePools.resourcePool',
      url: '/:id',
      views: {
        'content@': {
          component: 'kubernetesResourcePoolView',
        },
      },
    };

    const resourcePoolAccess = {
      name: 'kubernetes.resourcePools.resourcePool.access',
      url: '/access',
      views: {
        'content@': {
          component: 'kubernetesResourcePoolAccessView',
        },
      },
    };

    const volumes = {
      name: 'kubernetes.volumes',
      url: '/volumes',
      views: {
        'content@': {
          component: 'kubernetesVolumesView',
        },
      },
    };

    const volume = {
      name: 'kubernetes.volumes.volume',
      url: '/:namespace/:name',
      views: {
        'content@': {
          component: 'kubernetesVolumeView',
        },
      },
    };

    const registries = {
      name: 'kubernetes.registries',
      url: '/registries',
      views: {
        'content@': {
          component: 'endpointRegistriesView',
        },
      },
    };

    const registriesAccess = {
      name: 'kubernetes.registries.access',
      url: '/:id/access',
      views: {
        'content@': {
          component: 'kubernetesRegistryAccessView',
        },
      },
    };

    $stateRegistryProvider.register(kubernetes);
    $stateRegistryProvider.register(helmApplication);
    $stateRegistryProvider.register(helmTemplates);
    $stateRegistryProvider.register(applications);
    $stateRegistryProvider.register(applicationCreation);
    $stateRegistryProvider.register(application);
    $stateRegistryProvider.register(applicationEdit);
    $stateRegistryProvider.register(applicationConsole);
    $stateRegistryProvider.register(applicationLogs);
    $stateRegistryProvider.register(applicationStats);
    $stateRegistryProvider.register(stacks);
    $stateRegistryProvider.register(stack);
    $stateRegistryProvider.register(stackLogs);
    $stateRegistryProvider.register(configurations);
    $stateRegistryProvider.register(configurationCreation);
    $stateRegistryProvider.register(configuration);
    $stateRegistryProvider.register(cluster);
    $stateRegistryProvider.register(dashboard);
    $stateRegistryProvider.register(deploy);
    $stateRegistryProvider.register(node);
    $stateRegistryProvider.register(nodeStats);
    $stateRegistryProvider.register(resourcePools);
    $stateRegistryProvider.register(resourcePoolCreation);
    $stateRegistryProvider.register(resourcePool);
    $stateRegistryProvider.register(resourcePoolAccess);
    $stateRegistryProvider.register(volumes);
    $stateRegistryProvider.register(volume);
    $stateRegistryProvider.register(registries);
    $stateRegistryProvider.register(registriesAccess);
  },
]);
