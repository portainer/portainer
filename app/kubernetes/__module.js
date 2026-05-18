import { EnvironmentStatus } from '@/react/portainer/environments/types';

import { updateAxiosAdapter } from '@/react/portainer/services/axios/axios';
import { PortainerEndpointTypes } from '@/portainer/models/endpoint/models';
import { cache } from '@/react/portainer/services/axios/axios';
import { CACHE_REFRESH_EVENT, CACHE_DURATION } from '../portainer/services/http-request.helper';

import registriesModule from './registries';
import customTemplateModule from './custom-templates';
import { reactModule } from './react';
import './views/kubernetes.css';

// The angular-cache npm package didn't have exclude options, so implement a custom cache
// with an added check to only cache kubernetes requests
class ExpirationCache {
  constructor() {
    this.store = new Map();
    this.timeout = CACHE_DURATION;
  }

  get(key) {
    return this.store.get(key);
  }

  put(key, val) {
    // only cache requests with 'kubernetes' in the url
    if (key.includes('kubernetes')) {
      this.store.set(key, val);
      // remove it once it's expired
      setTimeout(() => {
        this.remove(key);
      }, this.timeout);
    }
  }

  remove(key) {
    this.store.delete(key);
  }

  removeAll() {
    this.store = new Map();
  }

  delete() {
    // skip because this is standalone, not a part of $cacheFactory
  }
}

angular.module('portainer.kubernetes', ['portainer.app', registriesModule, customTemplateModule, reactModule]).config([
  '$stateRegistryProvider',
  function ($stateRegistryProvider) {
    'use strict';

    const kubernetes = {
      name: 'kubernetes',
      url: '/kubernetes',
      parent: 'endpoint',
      abstract: true,

      onEnter: /* @ngInject */ function onEnter(
        $async,
        $state,
        endpoint,
        KubernetesHealthService,
        Notifications,
        StateManager,
        $http,
        Authentication,
        UserService,
        EndpointService,
        EndpointProvider
      ) {
        return $async(async () => {
          // if the user wants to use front end cache for performance, set the angular caching settings
          const userDetails = Authentication.getUserDetails();
          const user = await UserService.user(userDetails.ID);
          updateAxiosAdapter(user.UseCache);
          if (user.UseCache) {
            $http.defaults.cache = new ExpirationCache();
            window.addEventListener(CACHE_REFRESH_EVENT, () => {
              $http.defaults.cache.removeAll();
              cache.store.clear();
            });
          }

          // EE-5842: do not redirect shell views when the env is removed
          const nextTransition = $state.transition && $state.transition.to();
          const nextTransitionName = nextTransition ? nextTransition.name : '';
          if (nextTransitionName === 'kubernetes.kubectlshell' && !endpoint) {
            return;
          }

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
            const status = await checkEndpointStatus(endpoint);

            if (endpoint.Type !== PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment) {
              await updateEndpointStatus(endpoint, status);
            }
            endpoint.Status = status;

            if (endpoint.Status === EnvironmentStatus.Down) {
              throw new Error(
                endpoint.Type === PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment
                  ? 'Unable to contact Edge agent, please ensure that the agent is properly running on the remote environment.'
                  : `The environment named ${endpoint.Name} is unreachable.`
              );
            }

            await StateManager.updateEndpointState(endpoint);
          } catch (e) {
            let params = {};

            if (endpoint.Type == PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment) {
              params = { redirect: true, environmentId: endpoint.Id, environmentName: endpoint.Name, route: 'kubernetes.dashboard' };
            } else {
              EndpointProvider.clean();
              Notifications.error('Failed loading environment', e);
            }
            // Prevent redirect to home for shell views when environment is unreachable
            // Show toast error instead (handled above in Notifications.error)
            if (nextTransitionName === 'kubernetes.kubectlshell') {
              return;
            }
            $state.go('portainer.home', params, { reload: true, inherit: false });
            return false;
          }

          async function checkEndpointStatus(endpoint) {
            try {
              await KubernetesHealthService.ping(endpoint.Id);
              return EnvironmentStatus.Up;
            } catch (e) {
              return EnvironmentStatus.Down;
            }
          }

          async function updateEndpointStatus(endpoint, status) {
            if (endpoint.Status === status) {
              return;
            }
            await EndpointService.updateEndpoint(endpoint.Id, { Status: status });
          }
        });
      },
    };

    const helmApplication = {
      name: 'kubernetes.helm',
      url: '/helm/:namespace/:name?revision&tab',
      views: {
        'content@': {
          component: 'kubernetesHelmApplicationView',
        },
      },
      data: {
        docs: '/user/kubernetes/inspect-helm',
      },
    };

    const helmInstall = {
      name: 'kubernetes.helminstall',
      url: '/helm?referrer',
      views: {
        'content@': {
          component: 'helmInstallView',
        },
      },
      params: {
        yaml: '',
      },
      data: {
        docs: '/user/kubernetes/applications/manifest/helm',
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
      data: {
        docs: '/user/kubernetes/networking/services',
      },
    };
    const service = {
      name: 'kubernetes.services.service',
      url: '/:namespace/:name?tab',
      views: {
        'content@': {
          component: 'kubernetesResourceDetailsYAMLView',
        },
      },
      data: {
        resourceConfig: {
          title: 'Service details',
          breadcrumbLabel: 'Services',
          breadcrumbLink: 'kubernetes.services',
          resourceType: 'service',
          apiVersion: 'v1',
          resourcePlural: 'services',
          namespaced: true,
          yamlIdentifier: 'service-yaml',
          dataCy: 'service-yaml',
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
      data: {
        docs: '/user/kubernetes/networking/ingresses',
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
      data: {
        docs: '/user/kubernetes/networking/ingresses/add',
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
      url: '/applications?tab',
      views: {
        'content@': {
          component: 'kubernetesApplicationsView',
        },
      },
      data: {
        docs: '/user/kubernetes/applications',
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
      data: {
        docs: '/user/kubernetes/applications/add',
      },
    };

    const application = {
      name: 'kubernetes.applications.application',
      url: '/:namespace/:name?resource-type',
      params: {
        openGitSettings: { value: null, dynamic: true },
      },
      views: {
        'content@': {
          component: 'applicationDetailsView',
        },
      },
      data: {
        docs: '/user/kubernetes/applications/inspect',
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
      data: {
        docs: '/user/kubernetes/applications/edit',
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
      data: {
        docs: '/user/kubernetes/configurations',
      },
    };
    const configmaps = {
      name: 'kubernetes.configmaps',
      url: '/configmaps',
      abstract: true,
      data: {
        docs: '/user/kubernetes/configurations',
      },
    };

    const configMapCreation = {
      name: 'kubernetes.configmaps.new',
      url: '/new',
      views: {
        'content@': {
          component: 'kubernetesCreateConfigMapView',
        },
      },
      data: {
        docs: '/user/kubernetes/configurations/add-configmap',
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
      data: {
        docs: '/user/kubernetes/configurations',
      },
    };

    const secretCreation = {
      name: 'kubernetes.secrets.new',
      url: '/new',
      views: {
        'content@': {
          component: 'kubernetesCreateSecretView',
        },
      },
      data: {
        docs: '/user/kubernetes/configurations/add-secret',
      },
    };

    const secret = {
      name: 'kubernetes.secrets.secret',
      url: '/:namespace/:name?tab',
      params: {
        tab: { dynamic: true },
      },
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
      data: {
        docs: '/user/kubernetes/cluster/details',
      },
    };

    const node = {
      name: 'kubernetes.cluster.node',
      url: '/:nodeName?tab',
      views: {
        'content@': {
          component: 'kubernetesNodeViewReact',
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

    const kubectlShell = {
      name: 'kubernetes.kubectlshell',
      url: '/kubectl-shell',
      views: {
        'content@': {
          component: 'kubectlShellView',
        },
        'sidebar@': {},
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
      data: {
        docs: '/user/kubernetes/dashboard',
      },
    };

    const deploy = {
      name: 'kubernetes.deploy',
      url: '/deploy?templateId&referrer&tab&buildMethod&chartName',
      views: {
        'content@': {
          component: 'kubernetesDeployView',
        },
      },
      data: {
        docs: '/user/kubernetes/applications/manifest',
      },
    };

    const namespaces = {
      name: 'kubernetes.resourcePools',
      url: '/namespaces',
      views: {
        'content@': {
          component: 'kubernetesNamespacesView',
        },
      },
      data: {
        docs: '/user/kubernetes/namespaces',
      },
    };

    const namespaceCreation = {
      name: 'kubernetes.resourcePools.new',
      url: '/new',
      views: {
        'content@': {
          component: 'kubernetesCreateNamespaceView',
        },
      },
      data: {
        docs: '/user/kubernetes/namespaces/add',
      },
    };

    const namespace = {
      name: 'kubernetes.resourcePools.resourcePool',
      url: '/:id?tab',
      views: {
        'content@': {
          component: 'namespaceView',
        },
      },
      data: {
        docs: '/user/kubernetes/namespaces/manage',
      },
    };

    const namespaceAccess = {
      name: 'kubernetes.resourcePools.resourcePool.access',
      url: '/access',
      views: {
        'content@': {
          component: 'kubernetesNamespaceAccessView',
        },
      },
      data: {
        docs: '/user/kubernetes/namespaces/access',
      },
    };

    const volumes = {
      name: 'kubernetes.volumes',
      url: '/volumes?tab',
      views: {
        'content@': {
          component: 'kubernetesVolumesView',
        },
      },
      data: {
        docs: '/user/kubernetes/volumes',
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
          component: 'environmentRegistriesView',
        },
      },
      data: {
        docs: '/user/kubernetes/cluster/registries',
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
          component: 'kubernetesConfigureView',
        },
      },
      data: {
        docs: '/user/kubernetes/cluster/setup',
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
      data: {
        docs: '/user/kubernetes/cluster/security',
      },
    };

    const moreResources = {
      name: 'kubernetes.moreResources',
      url: '/moreResources',
      abstract: true,
    };

    const jobs = {
      name: 'kubernetes.moreResources.jobs',
      url: '/jobs?tab',
      views: {
        'content@': {
          component: 'jobsView',
        },
      },
      data: {
        docs: '/user/kubernetes/more-resources/jobs',
      },
    };
    const job = {
      name: 'kubernetes.moreResources.job',
      url: '/jobs/:namespace/:name?tab',
      views: {
        'content@': {
          component: 'kubernetesResourceDetailsYAMLView',
        },
      },
      data: {
        resourceConfig: {
          title: 'Job details',
          breadcrumbLabel: 'Cron Jobs & Jobs',
          breadcrumbLink: 'kubernetes.moreResources.jobs',
          breadcrumbTab: 'jobs',
          resourceType: 'job',
          apiVersion: 'batch/v1',
          resourcePlural: 'jobs',
          namespaced: true,
          yamlIdentifier: 'job-yaml',
          dataCy: 'job-yaml',
        },
      },
    };
    const cronJob = {
      name: 'kubernetes.moreResources.cronJob',
      url: '/cronjobs/:namespace/:name?tab',
      views: {
        'content@': {
          component: 'kubernetesResourceDetailsYAMLView',
        },
      },
      data: {
        resourceConfig: {
          title: 'Cron Job details',
          breadcrumbLabel: 'Cron Jobs & Jobs',
          breadcrumbLink: 'kubernetes.moreResources.jobs',
          breadcrumbTab: 'cronJobs',
          resourceType: 'cronjob',
          apiVersion: 'batch/v1',
          resourcePlural: 'cronjobs',
          namespaced: true,
          yamlIdentifier: 'cronjob-yaml',
          dataCy: 'cronjob-yaml',
        },
      },
    };

    const serviceAccounts = {
      name: 'kubernetes.moreResources.serviceAccounts',
      url: '/serviceAccounts',
      views: {
        'content@': {
          component: 'serviceAccountsView',
        },
      },
      data: {
        docs: '/user/kubernetes/more-resources/service-accounts',
      },
    };

    const serviceAccount = {
      name: 'kubernetes.moreResources.serviceAccounts.serviceAccount',
      url: '/serviceAccounts/:namespace/:name?tab',
      views: {
        'content@': {
          component: 'serviceAccountView',
        },
      },
      data: {
        docs: '/user/kubernetes/more-resources/service-accounts',
      },
    };

    const clusterRoles = {
      name: 'kubernetes.moreResources.clusterRoles',
      url: '/clusterRoles?tab',
      views: {
        'content@': {
          component: 'clusterRolesView',
        },
      },
      data: {
        docs: '/user/kubernetes/more-resources/cluster-roles',
      },
    };
    const clusterRole = {
      name: 'kubernetes.moreResources.clusterRole',
      url: '/clusterRoles/:name?tab',
      views: {
        'content@': {
          component: 'kubernetesResourceDetailsYAMLView',
        },
      },
      data: {
        resourceConfig: {
          title: 'Cluster Role details',
          breadcrumbLabel: 'Cluster Roles',
          breadcrumbLink: 'kubernetes.moreResources.clusterRoles',
          breadcrumbTab: 'clusterRoles',
          resourceType: 'clusterrole',
          apiVersion: 'rbac.authorization.k8s.io/v1',
          resourcePlural: 'clusterroles',
          namespaced: false,
          yamlIdentifier: 'cluster-role-yaml',
          dataCy: 'cluster-role-yaml',
        },
      },
    };
    const clusterRoleBinding = {
      name: 'kubernetes.moreResources.clusterRoleBinding',
      url: '/clusterRoleBindings/:name?tab',
      views: {
        'content@': {
          component: 'kubernetesResourceDetailsYAMLView',
        },
      },
      data: {
        resourceConfig: {
          title: 'Cluster Role Binding details',
          breadcrumbLabel: 'Cluster Roles',
          breadcrumbLink: 'kubernetes.moreResources.clusterRoles',
          breadcrumbTab: 'clusterRoleBindings',
          resourceType: 'clusterrolebinding',
          apiVersion: 'rbac.authorization.k8s.io/v1',
          resourcePlural: 'clusterrolebindings',
          namespaced: false,
          yamlIdentifier: 'cluster-role-binding-yaml',
          dataCy: 'cluster-role-binding-yaml',
        },
      },
    };

    const roles = {
      name: 'kubernetes.moreResources.roles',
      url: '/roles?tab',
      views: {
        'content@': {
          component: 'k8sRolesView',
        },
      },
      data: {
        docs: '/user/kubernetes/more-resources/namespace-roles',
      },
    };
    const role = {
      name: 'kubernetes.moreResources.role',
      url: '/roles/:namespace/:name?tab',
      views: {
        'content@': {
          component: 'kubernetesResourceDetailsYAMLView',
        },
      },
      data: {
        resourceConfig: {
          title: 'Role details',
          breadcrumbLabel: 'Roles',
          breadcrumbLink: 'kubernetes.moreResources.roles',
          breadcrumbTab: 'roles',
          resourceType: 'role',
          apiVersion: 'rbac.authorization.k8s.io/v1',
          resourcePlural: 'roles',
          namespaced: true,
          yamlIdentifier: 'role-yaml',
          dataCy: 'role-yaml',
        },
      },
    };
    const roleBinding = {
      name: 'kubernetes.moreResources.roleBinding',
      url: '/roleBindings/:namespace/:name?tab',
      views: {
        'content@': {
          component: 'kubernetesResourceDetailsYAMLView',
        },
      },
      data: {
        resourceConfig: {
          title: 'Role Binding details',
          breadcrumbLabel: 'Roles',
          breadcrumbLink: 'kubernetes.moreResources.roles',
          breadcrumbTab: 'roleBindings',
          resourceType: 'rolebinding',
          apiVersion: 'rbac.authorization.k8s.io/v1',
          resourcePlural: 'rolebindings',
          namespaced: true,
          yamlIdentifier: 'role-binding-yaml',
          dataCy: 'role-binding-yaml',
        },
      },
    };

    $stateRegistryProvider.register(kubernetes);
    $stateRegistryProvider.register(helmApplication);
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
    $stateRegistryProvider.register(helmInstall);
    $stateRegistryProvider.register(node);
    $stateRegistryProvider.register(nodeStats);
    $stateRegistryProvider.register(kubectlShell);
    $stateRegistryProvider.register(namespaces);
    $stateRegistryProvider.register(namespaceCreation);
    $stateRegistryProvider.register(namespace);
    $stateRegistryProvider.register(namespaceAccess);
    $stateRegistryProvider.register(volumes);
    $stateRegistryProvider.register(volume);
    $stateRegistryProvider.register(registries);
    $stateRegistryProvider.register(registriesAccess);
    $stateRegistryProvider.register(endpointKubernetesConfiguration);
    $stateRegistryProvider.register(endpointKubernetesSecurityConstraint);

    $stateRegistryProvider.register(services);
    $stateRegistryProvider.register(service);
    $stateRegistryProvider.register(ingresses);
    $stateRegistryProvider.register(ingressesCreate);
    $stateRegistryProvider.register(ingressesEdit);

    $stateRegistryProvider.register(moreResources);
    $stateRegistryProvider.register(jobs);
    $stateRegistryProvider.register(job);
    $stateRegistryProvider.register(cronJob);
    $stateRegistryProvider.register(serviceAccounts);
    $stateRegistryProvider.register(serviceAccount);
    $stateRegistryProvider.register(clusterRoles);
    $stateRegistryProvider.register(clusterRole);
    $stateRegistryProvider.register(clusterRoleBinding);
    $stateRegistryProvider.register(roles);
    $stateRegistryProvider.register(role);
    $stateRegistryProvider.register(roleBinding);
  },
]);
