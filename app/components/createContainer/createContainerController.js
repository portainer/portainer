angular.module('createContainer', [])
.controller('CreateContainerController', ['$scope', '$state', '$stateParams', '$filter', 'Config', 'Info', 'Container', 'ContainerHelper', 'Image', 'ImageHelper', 'Volume', 'Network', 'Messages',
function ($scope, $state, $stateParams, $filter, Config, Info, Container, ContainerHelper, Image, ImageHelper, Volume, Network, Messages) {

  $scope.formValues = {
    alwaysPull: true,
    Console: 'none',
    Volumes: [],
    Registry: '',
    NetworkContainer: ''
  };

  $scope.imageConfig = {};

  $scope.config = {
    Image: '',
    Env: [],
    ExposedPorts: {},
    HostConfig: {
      RestartPolicy: {
        Name: 'no'
      },
      PortBindings: [],
      Binds: [],
      NetworkMode: 'bridge',
      Privileged: false
    }
  };

  $scope.addVolume = function() {
    $scope.formValues.Volumes.push({ name: '', containerPath: '' });
  };

  $scope.removeVolume = function(index) {
    $scope.formValues.Volumes.splice(index, 1);
  };

  $scope.addEnvironmentVariable = function() {
    $scope.config.Env.push({ name: '', value: ''});
  };

  $scope.removeEnvironmentVariable = function(index) {
    $scope.config.Env.splice(index, 1);
  };

  $scope.addPortBinding = function() {
    $scope.config.HostConfig.PortBindings.push({ hostPort: '', containerPort: '', protocol: 'tcp' });
  };

  $scope.removePortBinding = function(index) {
    $scope.config.HostConfig.PortBindings.splice(index, 1);
  };

  Config.$promise.then(function (c) {
    $scope.swarm = c.swarm;
    var containersToHideLabels = c.hiddenLabels;

    Volume.query({}, function (d) {
      $scope.availableVolumes = d.Volumes;
    }, function (e) {
      Messages.error("Failure", e, "Unable to retrieve volumes");
    });

    Network.query({}, function (d) {
      var networks = d;
      if ($scope.swarm) {
        networks = d.filter(function (network) {
          if (network.Scope === 'global') {
            return network;
          }
        });
        $scope.globalNetworkCount = networks.length;
        networks.push({Name: "bridge"});
        networks.push({Name: "host"});
        networks.push({Name: "none"});
      }
      networks.push({Name: "container"});
      $scope.availableNetworks = networks;
      if (!_.find(networks, {'Name': 'bridge'})) {
        $scope.config.HostConfig.NetworkMode = 'nat';
      }
    }, function (e) {
      Messages.error("Failure", e, "Unable to retrieve networks");
    });

    Container.query({}, function (d) {
      var containers = d;
      if (containersToHideLabels) {
        containers = ContainerHelper.hideContainers(d, containersToHideLabels);
      }
      $scope.runningContainers = containers;
    }, function(e) {
      Messages.error("Failure", e, "Unable to retrieve running containers");
    });
  });

  // TODO: centralize, already present in templatesController
  function createContainer(config) {
    Container.create(config, function (d) {
      if (d.message) {
        $('#createContainerSpinner').hide();
        Messages.error('Error', {}, d.message);
      } else {
        Container.start({id: d.Id}, {}, function (cd) {
          if (cd.message) {
            $('#createContainerSpinner').hide();
            Messages.error('Error', {}, cd.message);
          } else {
            $('#createContainerSpinner').hide();
            Messages.send('Container Started', d.Id);
            $state.go('containers', {}, {reload: true});
          }
        }, function (e) {
          $('#createContainerSpinner').hide();
          Messages.error("Failure", e, 'Unable to start container');
        });
      }
    }, function (e) {
      $('#createContainerSpinner').hide();
      Messages.error("Failure", e, 'Unable to create container');
    });
  }

  // TODO: centralize, already present in templatesController
  function pullImageAndCreateContainer(config) {
    Image.create($scope.imageConfig, function (data) {
      createContainer(config);
    }, function (e) {
      $('#createContainerSpinner').hide();
      Messages.error('Failure', e, 'Unable to pull image');
    });
  }

  function prepareImageConfig(config) {
    var image = _.toLower(config.Image);
    var registry = $scope.formValues.Registry;
    var imageConfig = ImageHelper.createImageConfigForContainer(image, registry);
    config.Image = imageConfig.fromImage + ':' + imageConfig.tag;
    $scope.imageConfig = imageConfig;
  }

  function preparePortBindings(config) {
    var bindings = {};
    config.HostConfig.PortBindings.forEach(function (portBinding) {
      if (portBinding.containerPort) {
        var key = portBinding.containerPort + "/" + portBinding.protocol;
        var binding = {};
        if (portBinding.hostPort && portBinding.hostPort.indexOf(':') > -1) {
          var hostAndPort = portBinding.hostPort.split(':');
          binding.HostIp = hostAndPort[0];
          binding.HostPort = hostAndPort[1];
        } else {
          binding.HostPort = portBinding.hostPort;
        }
        bindings[key] = [binding];
        config.ExposedPorts[key] = {};
      }
    });
    config.HostConfig.PortBindings = bindings;
  }

  function prepareConsole(config) {
    var value = $scope.formValues.Console;
    var openStdin = true;
    var tty = true;
    if (value === 'tty') {
      openStdin = false;
    } else if (value === 'interactive') {
      tty = false;
    } else if (value === 'none') {
      openStdin = false;
      tty = false;
    }
    config.OpenStdin = openStdin;
    config.Tty = tty;
  }

  function prepareEnvironmentVariables(config) {
    var env = [];
    config.Env.forEach(function (v) {
      if (v.name && v.value) {
        env.push(v.name + "=" + v.value);
      }
    });
    config.Env = env;
  }

  function prepareVolumes(config) {
    var binds = [];
    var volumes = {};

    $scope.formValues.Volumes.forEach(function (volume) {
      var name = volume.name;
      var containerPath = volume.containerPath;
      if (name && containerPath) {
        var bind = name + ':' + containerPath;
        volumes[containerPath] = {};
        if (volume.readOnly) {
          bind += ':ro';
        }
        binds.push(bind);
      }
    });
    config.HostConfig.Binds = binds;
    config.Volumes = volumes;
  }

  function prepareNetworkConfig(config) {
    var mode = config.HostConfig.NetworkMode;
    var container = $scope.formValues.NetworkContainer;
    var containerName = container;
    if (container && typeof container === 'object') {
      containerName = $filter('trimcontainername')(container.Names[0]);
      if ($scope.swarm && $scope.endpointMode.provider === 'DOCKER_SWARM') {
        containerName = $filter('swarmcontainername')(container);
      }
    }
    var networkMode = mode;
    if (containerName) {
      networkMode += ':' + containerName;
    }
    config.HostConfig.NetworkMode = networkMode;
  }

  function prepareConfiguration() {
    var config = angular.copy($scope.config);
    prepareNetworkConfig(config);
    prepareImageConfig(config);
    preparePortBindings(config);
    prepareConsole(config);
    prepareEnvironmentVariables(config);
    prepareVolumes(config);
    return config;
  }

  $scope.create = function () {
    var config = prepareConfiguration();
    $('#createContainerSpinner').show();
    if ($scope.formValues.alwaysPull) {
      pullImageAndCreateContainer(config);
    } else {
      createContainer(config);
    }
  };
}]);
