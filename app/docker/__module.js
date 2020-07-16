angular.module('portainer.docker', ['portainer.app']).config([
  '$stateRegistryProvider',
  function ($stateRegistryProvider) {
    'use strict';

    var docker = {
      name: 'docker',
      parent: 'root',
      abstract: true,
      resolve: {
        endpointID: [
          'EndpointProvider',
          '$state',
          function (EndpointProvider, $state) {
            var id = EndpointProvider.endpointID();
            if (!id) {
              return $state.go('portainer.home');
            }
          },
        ],
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
    };

    var containers = {
      name: 'docker.containers',
      url: '/containers',
      views: {
        'content@': {
          templateUrl: './views/containers/containers.html',
          controller: 'ContainersController',
        },
      },
    };

    var container = {
      name: 'docker.containers.container',
      url: '/:id?nodeName',
      views: {
        'content@': {
          templateUrl: './views/containers/edit/container.html',
          controller: 'ContainerController',
        },
      },
    };

    var containerAttachConsole = {
      name: 'docker.containers.container.attach',
      url: '/attach',
      views: {
        'content@': {
          templateUrl: './views/containers/console/attach.html',
          controller: 'ContainerConsoleController',
        },
      },
    };

    var containerExecConsole = {
      name: 'docker.containers.container.exec',
      url: '/exec',
      views: {
        'content@': {
          templateUrl: './views/containers/console/exec.html',
          controller: 'ContainerConsoleController',
        },
      },
    };

    var containerCreation = {
      name: 'docker.containers.new',
      url: '/new?nodeName&from',
      views: {
        'content@': {
          templateUrl: './views/containers/create/createcontainer.html',
          controller: 'CreateContainerController',
        },
      },
    };

    var containerInspect = {
      name: 'docker.containers.container.inspect',
      url: '/inspect',
      views: {
        'content@': {
          templateUrl: './views/containers/inspect/containerinspect.html',
          controller: 'ContainerInspectController',
        },
      },
    };

    var containerLogs = {
      name: 'docker.containers.container.logs',
      url: '/logs',
      views: {
        'content@': {
          templateUrl: './views/containers/logs/containerlogs.html',
          controller: 'ContainerLogsController',
        },
      },
    };

    var containerStats = {
      name: 'docker.containers.container.stats',
      url: '/stats',
      views: {
        'content@': {
          templateUrl: './views/containers/stats/containerstats.html',
          controller: 'ContainerStatsController',
        },
      },
    };

    var dashboard = {
      name: 'docker.dashboard',
      url: '/dashboard',
      views: {
        'content@': {
          templateUrl: './views/dashboard/dashboard.html',
          controller: 'DashboardController',
        },
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
          templateUrl: './views/events/events.html',
          controller: 'EventsController',
        },
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
    };

    var network = {
      name: 'docker.networks.network',
      url: '/:id?nodeName',
      views: {
        'content@': {
          templateUrl: './views/networks/edit/network.html',
          controller: 'NetworkController',
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
    };

    var nodes = {
      name: 'docker.nodes',
      url: '/nodes',
      abstract: true,
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

    var swarm = {
      name: 'docker.swarm',
      url: '/swarm',
      views: {
        'content@': {
          templateUrl: './views/swarm/swarm.html',
          controller: 'SwarmController',
        },
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

    var volumes = {
      name: 'docker.volumes',
      url: '/volumes',
      views: {
        'content@': {
          templateUrl: './views/volumes/volumes.html',
          controller: 'VolumesController',
        },
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
    };

    $stateRegistryProvider.register(configs);
    $stateRegistryProvider.register(config);
    $stateRegistryProvider.register(configCreation);
    $stateRegistryProvider.register(containers);
    $stateRegistryProvider.register(container);
    $stateRegistryProvider.register(containerExecConsole);
    $stateRegistryProvider.register(containerAttachConsole);
    $stateRegistryProvider.register(containerCreation);
    $stateRegistryProvider.register(containerInspect);
    $stateRegistryProvider.register(containerLogs);
    $stateRegistryProvider.register(containerStats);
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
    $stateRegistryProvider.register(swarm);
    $stateRegistryProvider.register(swarmVisualizer);
    $stateRegistryProvider.register(tasks);
    $stateRegistryProvider.register(task);
    $stateRegistryProvider.register(taskLogs);
    $stateRegistryProvider.register(volumes);
    $stateRegistryProvider.register(volume);
    $stateRegistryProvider.register(volumeBrowse);
    $stateRegistryProvider.register(volumeCreation);
  },
]);
