angular.module('createContainer', [])
.controller('CreateContainerController', ['$scope', '$state', '$stateParams', 'Config', 'Info', 'Container', 'Image', 'Volume', 'Network', 'Messages',
function ($scope, $state, $stateParams, Config, Info, Container, Image, Volume, Network, Messages) {

  $scope.formValues = {
    alwaysPull: true,
    Console: 'none',
    Volumes: [],
    Registry: ''
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
    var swarm = c.swarm;
    Info.get({}, function(info) {
      if (swarm && !_.startsWith(info.ServerVersion, 'swarm')) {
        $scope.swarm_mode = true;
      }
    });

    Volume.query({}, function (d) {
      $scope.availableVolumes = d.Volumes;
    }, function (e) {
      Messages.error("Failure", e, "Unable to retrieve volumes");
    });

    Network.query({}, function (d) {
      var networks = d;
      if (swarm) {
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
      $scope.availableNetworks = networks;
      if (!_.find(networks, {'Name': 'bridge'})) {
        $scope.config.HostConfig.NetworkMode = 'nat';
      }
    }, function (e) {
      Messages.error("Failure", e, "Unable to retrieve networks");
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
      var err = data.length > 0 && data[data.length - 1].hasOwnProperty('error');
      if (err) {
        var detail = data[data.length - 1];
        $('#createContainerSpinner').hide();
        Messages.error('Error', {}, detail.error);
      } else {
        createContainer(config);
      }
    }, function (e) {
      $('#createContainerSpinner').hide();
      Messages.error('Failure', e, 'Unable to pull image');
    });
  }

  function createImageConfig(imageName, registry) {
    var imageNameAndTag = imageName.split(':');
    var image = imageNameAndTag[0];
    if (registry) {
      image = registry + '/' + imageNameAndTag[0];
    }
    var imageConfig = {
      fromImage: image,
      tag: imageNameAndTag[1] ? imageNameAndTag[1] : 'latest'
    };
    return imageConfig;
  }

  function prepareImageConfig(config) {
    var image = _.toLower(config.Image);
    var registry = $scope.formValues.Registry;
    var imageConfig = createImageConfig(image, registry);
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

  function prepareConfiguration() {
    var config = angular.copy($scope.config);
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
