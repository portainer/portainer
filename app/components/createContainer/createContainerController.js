angular.module('createContainer', [])
.controller('CreateContainerController', ['$scope', '$state', 'Config', 'Container', 'Image', 'Volume', 'Network', 'Messages', 'errorMsgFilter',
function ($scope, $state, Config, Container, Image, Volume, Network, Messages, errorMsgFilter) {

  $scope.state = {
    alwaysPull: true
  };

  $scope.formValues = {
    Console: 'none',
    Volumes: [],
    AvailableRegistries: [],
    Registry: ''
  };

  $scope.imageConfig = {};

  $scope.config = {
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

    $scope.formValues.AvailableRegistries = c.registries;

    Volume.query({}, function (d) {
      var persistedVolumes = d.Volumes.filter(function (volume) {
        if (volume.Driver === 'local-persist') {
          return volume;
        }
      });
      $scope.availableVolumes = _.uniqBy(persistedVolumes, 'Name');
    }, function (e) {
      Messages.error("Failure", e.data);
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
    }, function (e) {
      Messages.error("Failure", e.data);
    });
  });

  // TODO: centralize, already present in templatesController
  function createContainer(config) {
    Container.create(config, function (d) {
      if (d.Id) {
        var reqBody = config.HostConfig || {};
        reqBody.id = d.Id;
        Container.start(reqBody, function (cd) {
          $('#createContainerSpinner').hide();
          Messages.send('Container Started', d.Id);
          $state.go('containers', {}, {reload: true});
        }, function (e) {
          $('#createContainerSpinner').hide();
          Messages.error('Error', errorMsgFilter(e));
        });
      } else {
        $('#createContainerSpinner').hide();
        Messages.error('Error', errorMsgFilter(d));
      }
    }, function (e) {
      $('#createContainerSpinner').hide();
      Messages.error('Error', errorMsgFilter(e));
    });
  }

  // TODO: centralize, already present in templatesController
  function pullImageAndCreateContainer(config) {
    Image.create($scope.imageConfig, function (data) {
      var err = data.length > 0 && data[data.length - 1].hasOwnProperty('error');
      if (err) {
        var detail = data[data.length - 1];
        $('#createContainerSpinner').hide();
        Messages.error('Error', detail.error);
      } else {
        createContainer(config);
      }
    }, function (e) {
      $('#createContainerSpinner').hide();
      Messages.error('Error', 'Unable to pull image ' + image);
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
      if (portBinding.hostPort && portBinding.containerPort) {
        var key = portBinding.containerPort + "/" + portBinding.protocol;
        var binding = {};
        if (portBinding.hostPort.indexOf(':') > -1) {
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
    if ($scope.state.alwaysPull) {
      pullImageAndCreateContainer(config);
    } else {
      createContainer(config);
    }
  };

}]);
