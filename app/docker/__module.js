import angular from 'angular';

import { PortainerEndpointTypes } from 'Portainer/models/endpoint/models';

import { EnvironmentStatus } from '@/react/portainer/environments/types';

import { reactModule } from './react';

angular.module('portainer.docker', ['portainer.app', reactModule]).config([
  '$stateRegistryProvider',
  function ($stateRegistryProvider) {
    'use strict';

    var docker = {
      name: 'docker',
      parent: 'endpoint',
      url: '/docker',
      abstract: true,
      onEnter: /* @ngInject */ function onEnter(endpoint, $async, $state, EndpointService, Notifications, StateManager, SystemService, EndpointProvider) {
        return $async(async () => {
          const dockerTypes = [PortainerEndpointTypes.DockerEnvironment, PortainerEndpointTypes.AgentOnDockerEnvironment, PortainerEndpointTypes.EdgeAgentOnDockerEnvironment];

          if (!dockerTypes.includes(endpoint.Type)) {
            $state.go('portainer.home');
            return;
          }

          try {
            const status = await checkEndpointStatus(endpoint);

            if (endpoint.Type !== PortainerEndpointTypes.EdgeAgentOnDockerEnvironment) {
              await updateEndpointStatus(endpoint, status);
            }
            endpoint.Status = status;

            if (status === EnvironmentStatus.Down) {
              throw new Error(`The environment named ${endpoint.Name} is unreachable.`);
            }

            await StateManager.updateEndpointState(endpoint);
          } catch (e) {
            let params = {};

            if (endpoint.Type == PortainerEndpointTypes.EdgeAgentOnDockerEnvironment) {
              params = { redirect: true, environmentId: endpoint.Id, environmentName: endpoint.Name, route: 'docker.dashboard' };
            } else {
              EndpointProvider.clean();
              Notifications.error('Failed loading environment', e);
            }
            $state.go('portainer.home', params, { reload: true, inherit: false });
            return false;
          }

          async function checkEndpointStatus(endpoint) {
            try {
              await SystemService.ping(endpoint.Id);
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

    var configs = {
      name: 'docker.configs',
      url: '/configs',
      views: {
        'content@': {
          templateUrl: './views/configs/configs.html',
          controller: 'ConfigsController',
          controllerAs: 'ctrl',
        },
      },
      data: {
        docs: '/user/docker/configs',
      },
    };

    var config = {
      name: 'docker.configs.config',
      url: '/:id',
      views: {
        'content@': {
          templateUrl: './views/configs/edit/config.html',
          controller: 'ConfigController',
        },
      },
    };

    var configCreation = {
      name: 'docker.configs.new',
      url: '/new?id',
      views: {
        'content@': {
          templateUrl: './views/configs/create/createconfig.html',
          controller: 'CreateConfigController',
          controllerAs: 'ctrl',
        },
      },
      data: {
        docs: '/user/docker/configs/add',
      },
    };

    const customTemplates = {
      name: 'docker.templates.custom',
      url: '/custom',

      views: {
        'content@': {
          component: 'customTemplatesView',
        },
      },
      data: {
        docs: '/user/docker/templates/custom',
      },
    };

    const customTemplatesNew = {
      name: 'docker.templates.custom.new',
      url: '/new?fileContent&appTemplateId&type',

      views: {
        'content@': {
          component: 'createCustomTemplatesView',
        },
      },
    };

    const customTemplatesEdit = {
      name: 'docker.templates.custom.edit',
      url: '/:id',

      views: {
        'content@': {
          component: 'editCustomTemplatesView',
        },
      },
    };

    var dashboard = {
      name: 'docker.dashboard',
      url: '/dashboard',
      views: {
        'content@': {
          component: 'dockerDashboardView',
        },
      },
      data: {
        docs: '/user/docker/dashboard',
      },
    };

    var host = {
      name: 'docker.host',
      url: '/host',
      views: {
        'content@': {
          component: 'hostView',
        },
      },
      data: {
        docs: '/user/docker/host/details',
      },
    };

    var hostBrowser = {
      name: 'docker.host.browser',
      url: '/browser',
      views: {
        'content@': {
          component: 'hostBrowserView',
        },
      },
    };

    var events = {
      name: 'docker.events',
      url: '/events',
      views: {
        'content@': {
          component: 'eventsListView',
        },
      },
      data: {
        docs: '/user/docker/events',
      },
    };

    var images = {
      name: 'docker.images',
      url: '/images',
      views: {
        'content@': {
          templateUrl: './views/images/images.html',
          controller: 'ImagesController',
        },
      },
      data: {
        docs: '/user/docker/images',
      },
    };

    var image = {
      name: 'docker.images.image',
      url: '/:id?nodeName',
      views: {
        'content@': {
          templateUrl: './views/images/edit/image.html',
          controller: 'ImageController',
        },
      },
    };

    var imageBuild = {
      name: 'docker.images.build',
      url: '/build',
      views: {
        'content@': {
          templateUrl: './views/images/build/buildimage.html',
          controller: 'BuildImageController',
        },
      },
      data: {
        docs: '/user/docker/images/build',
      },
    };

    var imageImport = {
      name: 'docker.images.import',
      url: '/import',
      views: {
        'content@': {
          templateUrl: './views/images/import/importimage.html',
          controller: 'ImportImageController',
        },
      },
      data: {
        docs: '/user/docker/images/import',
      },
    };

    var networks = {
      name: 'docker.networks',
      url: '/networks',
      views: {
        'content@': {
          templateUrl: './views/networks/networks.html',
          controller: 'NetworksController',
        },
      },
      data: {
        docs: '/user/docker/networks',
      },
    };

    var network = {
      name: 'docker.networks.network',
      url: '/:id?nodeName',
      views: {
        'content@': {
          component: 'networkDetailsView',
        },
      },
    };

    var networkCreation = {
      name: 'docker.networks.new',
      url: '/new',
      views: {
        'content@': {
          templateUrl: './views/networks/create/createnetwork.html',
          controller: 'CreateNetworkController',
        },
      },
      data: {
        docs: '/user/docker/networks/add',
      },
    };

    var nodes = {
      name: 'docker.nodes',
      url: '/nodes',
      abstract: true,
      data: {
        docs: '/user/docker/swarm/details',
      },
    };

    var node = {
      name: 'docker.nodes.node',
      url: '/:id',
      views: {
        'content@': {
          component: 'nodeDetailsView',
        },
      },
    };

    var nodeBrowser = {
      name: 'docker.nodes.node.browse',
      url: '/browse',
      views: {
        'content@': {
          component: 'nodeBrowserView',
        },
      },
    };

    var secrets = {
      name: 'docker.secrets',
      url: '/secrets',
      views: {
        'content@': {
          templateUrl: './views/secrets/secrets.html',
          controller: 'SecretsController',
        },
      },
      data: {
        docs: '/user/docker/secrets',
      },
    };

    var secret = {
      name: 'docker.secrets.secret',
      url: '/:id',
      views: {
        'content@': {
          templateUrl: './views/secrets/edit/secret.html',
          controller: 'SecretController',
        },
      },
    };

    var secretCreation = {
      name: 'docker.secrets.new',
      url: '/new',
      views: {
        'content@': {
          templateUrl: './views/secrets/create/createsecret.html',
          controller: 'CreateSecretController',
        },
      },
      data: {
        docs: '/user/docker/secrets/add',
      },
    };

    var services = {
      name: 'docker.services',
      url: '/services',
      views: {
        'content@': {
          templateUrl: './views/services/services.html',
          controller: 'ServicesController',
        },
      },
      data: {
        docs: '/user/docker/services',
      },
    };

    var service = {
      name: 'docker.services.service',
      url: '/:id',
      views: {
        'content@': {
          templateUrl: './views/services/edit/service.html',
          controller: 'ServiceController',
        },
      },
    };

    var serviceCreation = {
      name: 'docker.services.new',
      url: '/new',
      views: {
        'content@': {
          templateUrl: './views/services/create/createservice.html',
          controller: 'CreateServiceController',
        },
      },
      data: {
        docs: '/user/docker/stacks/add',
      },
    };

    var serviceLogs = {
      name: 'docker.services.service.logs',
      url: '/logs',
      views: {
        'content@': {
          templateUrl: './views/services/logs/servicelogs.html',
          controller: 'ServiceLogsController',
        },
      },
    };

    var stacks = {
      name: 'docker.stacks',
      url: '/stacks',
      views: {
        'content@': {
          templateUrl: '~Portainer/views/stacks/stacks.html',
          controller: 'StacksController',
        },
      },
      data: {
        docs: '/user/docker/stacks',
      },
    };

    var stack = {
      name: 'docker.stacks.stack',
      url: '/:name?id&type&regular&external&orphaned&orphanedRunning',
      views: {
        'content@': {
          templateUrl: '~Portainer/views/stacks/edit/stack.html',
          controller: 'StackController',
        },
      },
    };

    var stackContainer = {
      name: 'docker.stacks.stack.container',
      url: '/:id?nodeName',
      views: {
        'content@': {
          templateUrl: '~@/docker/views/containers/edit/container.html',
          controller: 'ContainerController',
        },
      },
    };

    var stackCreation = {
      name: 'docker.stacks.newstack',
      url: '/newstack',
      views: {
        'content@': {
          templateUrl: '~Portainer/views/stacks/create/createstack.html',
          controller: 'CreateStackController',
        },
      },
    };

    var swarm = {
      name: 'docker.swarm',
      url: '/swarm',
      views: {
        'content@': {
          templateUrl: './views/swarm/swarm.html',
          controller: 'SwarmController',
        },
      },
      data: {
        docs: '/user/docker/swarm/details',
      },
    };

    var swarmVisualizer = {
      name: 'docker.swarm.visualizer',
      url: '/visualizer',
      views: {
        'content@': {
          templateUrl: './views/swarm/visualizer/swarmvisualizer.html',
          controller: 'SwarmVisualizerController',
        },
      },
      data: {
        docs: '/user/docker/swarm/cluster-visualizer',
      },
    };

    var tasks = {
      name: 'docker.tasks',
      url: '/tasks',
      abstract: true,
    };

    var task = {
      name: 'docker.tasks.task',
      url: '/:id',
      views: {
        'content@': {
          templateUrl: './views/tasks/edit/task.html',
          controller: 'TaskController',
        },
      },
    };

    var taskLogs = {
      name: 'docker.tasks.task.logs',
      url: '/logs',
      views: {
        'content@': {
          templateUrl: './views/tasks/logs/tasklogs.html',
          controller: 'TaskLogsController',
        },
      },
    };

    var templates = {
      name: 'docker.templates',
      url: '/templates?template',
      views: {
        'content@': {
          component: 'appTemplatesView',
        },
      },
      data: {
        docs: '/user/docker/templates/application',
      },
    };

    var volumes = {
      name: 'docker.volumes',
      url: '/volumes',
      views: {
        'content@': {
          templateUrl: './views/volumes/volumes.html',
          controller: 'VolumesController',
        },
      },
      data: {
        docs: '/user/docker/volumes',
      },
    };

    var volume = {
      name: 'docker.volumes.volume',
      url: '/:id?nodeName',
      views: {
        'content@': {
          templateUrl: './views/volumes/edit/volume.html',
          controller: 'VolumeController',
        },
      },
    };

    var volumeBrowse = {
      name: 'docker.volumes.volume.browse',
      url: '/browse',
      views: {
        'content@': {
          templateUrl: './views/volumes/browse/browsevolume.html',
          controller: 'BrowseVolumeController',
        },
      },
    };

    var volumeCreation = {
      name: 'docker.volumes.new',
      url: '/new',
      views: {
        'content@': {
          templateUrl: './views/volumes/create/createvolume.html',
          controller: 'CreateVolumeController',
        },
      },
      data: {
        docs: '/user/docker/volumes/add',
      },
    };

    const dockerFeaturesConfiguration = {
      name: 'docker.host.featuresConfiguration',
      url: '/feat-config',
      views: {
        'content@': {
          component: 'dockerFeaturesConfigurationView',
        },
      },
      data: {
        docs: '/user/docker/host/setup',
      },
    };

    const swarmFeaturesConfiguration = {
      name: 'docker.swarm.featuresConfiguration',
      url: '/feat-config',
      views: {
        'content@': {
          component: 'dockerFeaturesConfigurationView',
        },
      },
      data: {
        docs: '/user/docker/swarm/setup',
      },
    };

    const dockerRegistries = {
      name: 'docker.host.registries',
      url: '/registries',
      views: {
        'content@': {
          component: 'environmentRegistriesView',
        },
      },
      data: {
        docs: '/user/docker/host/registries',
      },
    };

    const swarmRegistries = {
      name: 'docker.swarm.registries',
      url: '/registries',
      views: {
        'content@': {
          component: 'environmentRegistriesView',
        },
      },
      data: {
        docs: '/user/docker/swarm/registries',
      },
    };

    const dockerRegistryAccess = {
      name: 'docker.host.registries.access',
      url: '/:id/access',
      views: {
        'content@': {
          component: 'dockerRegistryAccessView',
        },
      },
    };

    const swarmRegistryAccess = {
      name: 'docker.swarm.registries.access',
      url: '/:id/access',
      views: {
        'content@': {
          component: 'dockerRegistryAccessView',
        },
      },
    };

    $stateRegistryProvider.register(configs);
    $stateRegistryProvider.register(config);
    $stateRegistryProvider.register(configCreation);

    $stateRegistryProvider.register(customTemplates);
    $stateRegistryProvider.register(customTemplatesNew);
    $stateRegistryProvider.register(customTemplatesEdit);
    $stateRegistryProvider.register(docker);
    $stateRegistryProvider.register(dashboard);
    $stateRegistryProvider.register(host);
    $stateRegistryProvider.register(hostBrowser);
    $stateRegistryProvider.register(events);
    $stateRegistryProvider.register(images);
    $stateRegistryProvider.register(image);
    $stateRegistryProvider.register(imageBuild);
    $stateRegistryProvider.register(imageImport);
    $stateRegistryProvider.register(networks);
    $stateRegistryProvider.register(network);
    $stateRegistryProvider.register(networkCreation);
    $stateRegistryProvider.register(nodes);
    $stateRegistryProvider.register(node);
    $stateRegistryProvider.register(nodeBrowser);
    $stateRegistryProvider.register(secrets);
    $stateRegistryProvider.register(secret);
    $stateRegistryProvider.register(secretCreation);
    $stateRegistryProvider.register(services);
    $stateRegistryProvider.register(service);
    $stateRegistryProvider.register(serviceCreation);
    $stateRegistryProvider.register(serviceLogs);
    $stateRegistryProvider.register(stacks);
    $stateRegistryProvider.register(stack);
    $stateRegistryProvider.register(stackContainer);
    $stateRegistryProvider.register(stackCreation);
    $stateRegistryProvider.register(swarm);
    $stateRegistryProvider.register(swarmVisualizer);
    $stateRegistryProvider.register(tasks);
    $stateRegistryProvider.register(task);
    $stateRegistryProvider.register(taskLogs);
    $stateRegistryProvider.register(templates);
    $stateRegistryProvider.register(volumes);
    $stateRegistryProvider.register(volume);
    $stateRegistryProvider.register(volumeBrowse);
    $stateRegistryProvider.register(volumeCreation);
    $stateRegistryProvider.register(dockerFeaturesConfiguration);
    $stateRegistryProvider.register(swarmFeaturesConfiguration);
    $stateRegistryProvider.register(dockerRegistries);
    $stateRegistryProvider.register(swarmRegistries);
    $stateRegistryProvider.register(dockerRegistryAccess);
    $stateRegistryProvider.register(swarmRegistryAccess);
  },
]);
