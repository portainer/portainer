import { EnvironmentStatus } from '@/react/portainer/environments/types';
import { getSelfSubjectAccessReview } from '@/react/kubernetes/namespaces/service';

import { PortainerEndpointTypes } from 'Portainer/models/endpoint/models';

import registriesModule from './registries';
import customTemplateModule from './custom-templates';
import { reactModule } from './react';
import './views/kubernetes.css';

angular.module('portainer.kubernetes', ['portainer.app', registriesModule, customTemplateModule, reactModule]).config([
  '$stateRegistryProvider',
  function ($stateRegistryProvider) {
    'use strict';

    const kubernetes = {
      name: 'kubernetes',
      url: '/kubernetes',
      parent: 'endpoint',
      abstract: true,

      onEnter: /* @ngInject */ function onEnter($async, $state, endpoint, KubernetesHealthService, KubernetesNamespaceService, Notifications, StateManager) {
        return $async(async () => {
          const kubeTypes = [
            PortainerEndpointTypes.KubernetesLocalEnvironment,
            PortainerEndpointTypes.AgentOnKubernetesEnvironment,
            PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment,
          ];

          if (!kubeTypes.includes(endpoint.Type)) {
            $state.go('portainer.home');
            return;
          }
          try {
            if (endpoint.Type === PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment) {
              //edge
              try {
                await KubernetesHealthService.ping(endpoint.Id);
                endpoint.Status = EnvironmentStatus.Up;
              } catch (e) {
                endpoint.Status = EnvironmentStatus.Down;
              }
            }

            await StateManager.updateEndpointState(endpoint);

            if (endpoint.Type === PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment && endpoint.Status === EnvironmentStatus.Down) {
              throw new Error('Unable to contact Edge agent, please ensure that the agent is properly running on the remote environment.');
            }

            // use selfsubject access review to check if we can connect to the kubernetes environment
            // because it's gets a fast response, and is accessible to all users
            try {
              await getSelfSubjectAccessReview(endpoint.Id, 'default');
            } catch (e) {
              throw new Error('Environment is unreachable.');
            }
          } catch (e) {
            let params = {};

            if (endpoint.Type == PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment) {
              params = { redirect: true, environmentId: endpoint.Id, environmentName: endpoint.Name, route: 'kubernetes.dashboard' };
            } else {
              Notifications.error('Failed loading environment', e);
            }
            $state.go('portainer.home', params, { reload: true, inherit: false });
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

    const services = {
      name: 'kubernetes.services',
      url: '/services',
      views: {
        'content@': {
          component: 'kubernetesServicesView',
        },
      },
    };

    const ingresses = {
      name: 'kubernetes.ingresses',
      url: '/ingresses',
      views: {
        'content@': {
          component: 'kubernetesIngressesView',
        },
      },
    };

    const ingressesCreate = {
      name: 'kubernetes.ingresses.create',
      url: '/add',
      views: {
        'content@': {
          component: 'kubernetesIngressesCreateView',
        },
      },
    };

    const ingressesEdit = {
      name: 'kubernetes.ingresses.edit',
      url: '/:namespace/:name/edit',
      views: {
        'content@': {
          component: 'kubernetesIngressesCreateView',
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
      url: '/:namespace/:name?resource-type',
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
          component: 'kubernetesConsoleView',
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
      url: '/configurations?tab',
      views: {
        'content@': {
          component: 'kubernetesConfigMapsAndSecretsView',
        },
      },
      params: {
        tab: null,
      },
    };
    const configmaps = {
      name: 'kubernetes.configmaps',
      url: '/configmaps',
      abstract: true,
    };

    const configMapCreation = {
      name: 'kubernetes.configmaps.new',
      url: '/new',
      views: {
        'content@': {
          component: 'kubernetesCreateConfigMapView',
        },
      },
    };

    const configMap = {
      name: 'kubernetes.configmaps.configmap',
      url: '/:namespace/:name',
      views: {
        'content@': {
          component: 'kubernetesConfigMapView',
        },
      },
    };

    const secrets = {
      name: 'kubernetes.secrets',
      url: '/secrets',
      abstract: true,
    };

    const secretCreation = {
      name: 'kubernetes.secrets.new',
      url: '/new',
      views: {
        'content@': {
          component: 'kubernetesCreateSecretView',
        },
      },
    };

    const secret = {
      name: 'kubernetes.secrets.secret',
      url: '/:namespace/:name',
      views: {
        'content@': {
          component: 'kubernetesSecretView',
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
      url: '/deploy?templateId&referrer&tab',
      views: {
        'content@': {
          component: 'kubernetesDeployView',
        },
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

    const endpointKubernetesConfiguration = {
      name: 'kubernetes.cluster.setup',
      url: '/configure',
      views: {
        'content@': {
          templateUrl: './views/configure/configure.html',
          controller: 'KubernetesConfigureController',
          controllerAs: 'ctrl',
        },
      },
    };

    const endpointKubernetesSecurityConstraint = {
      name: 'kubernetes.cluster.securityConstraint',
      url: '/securityConstraint',
      views: {
        'content@': {
          templateUrl: '../kubernetes/views/security-constraint/constraint.html',
          controller: 'KubernetesSecurityConstraintController',
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
    $stateRegistryProvider.register(configmaps);
    $stateRegistryProvider.register(configMapCreation);
    $stateRegistryProvider.register(secrets);
    $stateRegistryProvider.register(secretCreation);
    $stateRegistryProvider.register(configMap);
    $stateRegistryProvider.register(secret);
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
    $stateRegistryProvider.register(endpointKubernetesConfiguration);
    $stateRegistryProvider.register(endpointKubernetesSecurityConstraint);

    $stateRegistryProvider.register(services);
    $stateRegistryProvider.register(ingresses);
    $stateRegistryProvider.register(ingressesCreate);
    $stateRegistryProvider.register(ingressesEdit);
  },
]);
