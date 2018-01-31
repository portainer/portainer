angular.module('portainer.docker', ['portainer.app'])
.config(['$stateRegistryProvider', function ($stateRegistryProvider) {
  'use strict';

  var docker = {
    name: 'docker',
    parent: 'root',
    abstract: true
  };

  var configs = {
    name: 'docker.configs',
    url: '/configs',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/configs/configs.html',
        controller: 'ConfigsController'
      }
    }
  };

  var config = {
    name: 'docker.configs.config',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/configs/edit/config.html',
        controller: 'ConfigController'
      }
    }
  };

  var configCreation = {
    name: 'docker.configs.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/configs/create/createconfig.html',
        controller: 'CreateConfigController'
      }
    }
  };

  var containers = {
    name: 'docker.containers',
    url: '/containers',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/containers/containers.html',
        controller: 'ContainersController'
      }
    },
    params: {
      selectedContainers: []
    }
  };

  var container = {
    name: 'docker.containers.container',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/containers/edit/container.html',
        controller: 'ContainerController'
      }
    }
  };

  var containerConsole = {
    name: 'docker.containers.container.console',
    url: '/console',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/containers/console/containerconsole.html',
        controller: 'ContainerConsoleController'
      }
    }
  };

  var containerCreation = {
    name: 'docker.containers.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/containers/create/createcontainer.html',
        controller: 'CreateContainerController'
      }
    },
    params: {
      from: ''
    }
  };

  var containerInspect = {
    name: 'docker.containers.container.inspect',
    url: '/inspect',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/containers/inspect/containerinspect.html',
        controller: 'ContainerInspectController'
      }
    }
  };

  var containerLogs = {
    name: 'docker.containers.container.logs',
    url: '/logs',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/containers/logs/containerlogs.html',
        controller: 'ContainerLogsController'
      }
    }
  };

  var containerStats = {
    name: 'docker.containers.container.stats',
    url: '/stats',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/containers/stats/containerstats.html',
        controller: 'ContainerStatsController'
      }
    }
  };

  var dashboard = {
    name: 'docker.dashboard',
    url: '/dashboard',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/dashboard/dashboard.html',
        controller: 'DashboardController'
      }
    }
  };

  var engine = {
    name: 'docker.engine',
    url: '/engine',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/engine/engine.html',
        controller: 'EngineController'
      }
    }
  };

  var events = {
    name: 'docker.events',
    url: '/events',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/events/events.html',
        controller: 'EventsController'
      }
    }
  };

  var images = {
    name: 'docker.images',
    url: '/images',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/images/images.html',
        controller: 'ImagesController'
      }
    }
  };

  var image = {
    name: 'docker.images.image',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/images/edit/image.html',
        controller: 'ImageController'
      }
    }
  };

  var networks = {
    name: 'docker.networks',
    url: '/networks',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/networks/networks.html',
        controller: 'NetworksController'
      }
    }
  };

  var network = {
    name: 'docker.networks.network',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/networks/edit/network.html',
        controller: 'NetworkController'
      }
    }
  };

  var networkCreation = {
    name: 'docker.networks.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/networks/create/createnetwork.html',
        controller: 'CreateNetworkController'
      }
    }
  };

  var nodes = {
    name: 'docker.nodes',
    url: '/nodes',
    abstract: true
  };

  var node = {
    name: 'docker.nodes.node',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/nodes/edit/node.html',
        controller: 'NodeController'
      }
    }
  };

  var secrets = {
    name: 'docker.secrets',
    url: '/secrets',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/secrets/secrets.html',
        controller: 'SecretsController'
      }
    }
  };

  var secret = {
    name: 'docker.secrets.secret',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/secrets/edit/secret.html',
        controller: 'SecretController'
      }
    }
  };

  var secretCreation = {
    name: 'docker.secrets.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/secrets/create/createsecret.html',
        controller: 'CreateSecretController'
      }
    }
  };

  var services = {
    name: 'docker.services',
    url: '/services',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/services/services.html',
        controller: 'ServicesController'
      }
    }
  };

  var service = {
    name: 'docker.services.service',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/services/edit/service.html',
        controller: 'ServiceController'
      }
    }
  };

  var serviceCreation = {
    name: 'docker.services.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/services/create/createservice.html',
        controller: 'CreateServiceController'
      }
    }
  };

  var serviceLogs = {
    name: 'docker.services.service.logs',
    url: '/logs',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/services/logs/servicelogs.html',
        controller: 'ServiceLogsController'
      }
    }
  };

  var stacks = {
    name: 'docker.stacks',
    url: '/stacks',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/stacks/stacks.html',
        controller: 'StacksController'
      }
    }
  };

  var stack = {
    name: 'docker.stacks.stack',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/stacks/edit/stack.html',
        controller: 'StackController'
      }
    }
  };

  var stackCreation = {
    name: 'docker.stacks.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/stacks/create/createstack.html',
        controller: 'CreateStackController'
      }
    }
  };

  var swarm = {
    name: 'docker.swarm',
    url: '/swarm',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/swarm/swarm.html',
        controller: 'SwarmController'
      }
    }
  };

  var swarmVisualizer = {
    name: 'docker.swarm.visualizer',
    url: '/visualizer',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/swarm/visualizer/swarmvisualizer.html',
        controller: 'SwarmVisualizerController'
      }
    }
  };

  var tasks = {
    name: 'docker.tasks',
    url: '/tasks',
    abstract: true
  };

  var task = {
    name: 'docker.tasks.task',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/tasks/edit/task.html',
        controller: 'TaskController'
      }
    }
  };

  var templates = {
    name: 'docker.templates',
    url: '/templates',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/templates/templates.html',
        controller: 'TemplatesController'
      }
    },
    params: {
      key: 'containers',
      hide_descriptions: false
    }
  };

  var templatesLinuxServer = {
    name: 'docker.templates.linuxserver',
    url: '/linuxserver',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/templates/templates.html',
        controller: 'TemplatesController'
      }
    },
    params: {
      key: 'linuxserver.io',
      hide_descriptions: true
    }
  };

  var volumes = {
    name: 'docker.volumes',
    url: '/volumes',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/volumes/volumes.html',
        controller: 'VolumesController'
      }
    }
  };

  var volume = {
    name: 'docker.volumes.volume',
    url: '/:id',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/volumes/edit/volume.html',
        controller: 'VolumeController'
      }
    }
  };

  var volumeCreation = {
    name: 'docker.volumes.new',
    url: '/new',
    views: {
      'content@': {
        templateUrl: 'app/docker/views/volumes/create/createvolume.html',
        controller: 'CreateVolumeController'
      }
    }
  };

  $stateRegistryProvider.register(configs);
  $stateRegistryProvider.register(config);
  $stateRegistryProvider.register(configCreation);
  $stateRegistryProvider.register(containers);
  $stateRegistryProvider.register(container);
  $stateRegistryProvider.register(containerConsole);
  $stateRegistryProvider.register(containerCreation);
  $stateRegistryProvider.register(containerInspect);
  $stateRegistryProvider.register(containerLogs);
  $stateRegistryProvider.register(containerStats);
  $stateRegistryProvider.register(docker);
  $stateRegistryProvider.register(dashboard);
  $stateRegistryProvider.register(engine);
  $stateRegistryProvider.register(events);
  $stateRegistryProvider.register(images);
  $stateRegistryProvider.register(image);
  $stateRegistryProvider.register(networks);
  $stateRegistryProvider.register(network);
  $stateRegistryProvider.register(networkCreation);
  $stateRegistryProvider.register(nodes);
  $stateRegistryProvider.register(node);
  $stateRegistryProvider.register(secrets);
  $stateRegistryProvider.register(secret);
  $stateRegistryProvider.register(secretCreation);
  $stateRegistryProvider.register(services);
  $stateRegistryProvider.register(service);
  $stateRegistryProvider.register(serviceCreation);
  $stateRegistryProvider.register(serviceLogs);
  $stateRegistryProvider.register(stacks);
  $stateRegistryProvider.register(stack);
  $stateRegistryProvider.register(stackCreation);
  $stateRegistryProvider.register(swarm);
  $stateRegistryProvider.register(swarmVisualizer);
  $stateRegistryProvider.register(tasks);
  $stateRegistryProvider.register(task);
  $stateRegistryProvider.register(templates);
  $stateRegistryProvider.register(templatesLinuxServer);
  $stateRegistryProvider.register(volumes);
  $stateRegistryProvider.register(volume);
  $stateRegistryProvider.register(volumeCreation);
}]);
