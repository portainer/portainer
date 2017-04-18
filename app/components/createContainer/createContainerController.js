// @@OLD_SERVICE_CONTROLLER: this service should be rewritten to use services.
// See app/components/templates/templatesController.js as a reference.
angular.module('createContainer', [])
.controller('CreateContainerController', ['$scope', '$state', '$stateParams', '$filter', 'Config', 'Info', 'Container', 'ContainerHelper', 'Image', 'ImageHelper', 'Volume', 'Network', 'ResourceControlService', 'Authentication', 'Notifications',
function ($scope, $state, $stateParams, $filter, Config, Info, Container, ContainerHelper, Image, ImageHelper, Volume, Network, ResourceControlService, Authentication, Notifications) {

  $scope.formValues = {
    Ownership: $scope.applicationState.application.authentication ? 'private' : '',
    Ownership_groups: [],
    alwaysPull: true,
    Console: 'none',
    Volumes: [],
    Registry: '',
    NetworkContainer: '',
    Labels: [],
    ExtraHosts: [],
  };

  $scope.Teams = [{Id: 1, Name: 'dev-projectA'}, {Id: 2, Name: 'dev-projectB'}, {Id: 3, Name: 'qa-01'}, {Id: 4, Name: 'qa-02'}];

  $scope.imageConfig = {};

  $scope.config = {
    Image: '',
    Env: [],
    Cmd: '',
    ExposedPorts: {},
    HostConfig: {
      RestartPolicy: {
        Name: 'no'
      },
      PortBindings: [],
      PublishAllPorts: false,
      Binds: [],
      NetworkMode: 'bridge',
      Privileged: false,
      ExtraHosts: [],
      Devices:[]
    },
    Labels: {}
  };

  $scope.addVolume = function() {
    $scope.formValues.Volumes.push({ name: '', containerPath: '', readOnly: false, type: 'volume' });
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

  $scope.addLabel = function() {
    $scope.formValues.Labels.push({ name: '', value: ''});
  };

  $scope.removeLabel = function(index) {
    $scope.formValues.Labels.splice(index, 1);
  };

  $scope.addExtraHost = function() {
    $scope.formValues.ExtraHosts.push({ value: '' });
  };

  $scope.removeExtraHost = function(index) {
    $scope.formValues.ExtraHosts.splice(index, 1);
  };
  
  $scope.addDevice = function() {
    $scope.config.HostConfig.Devices.push({ pathOnHost: '', pathInContainer: '' });
  };

  $scope.removeDevice = function(index) {
    $scope.config.HostConfig.Devices.splice(index, 1);
  };

  Config.$promise.then(function (c) {
    var containersToHideLabels = c.hiddenLabels;

    Volume.query({}, function (d) {
      $scope.availableVolumes = d.Volumes;
    }, function (e) {
      Notifications.error("Failure", e, "Unable to retrieve volumes");
    });

    Network.query({}, function (d) {
      var networks = d;
      if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM' || $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
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
      Notifications.error("Failure", e, "Unable to retrieve networks");
    });

    Container.query({}, function (d) {
      var containers = d;
      if (containersToHideLabels) {
        containers = ContainerHelper.hideContainers(d, containersToHideLabels);
      }
      $scope.runningContainers = containers;
    }, function(e) {
      Notifications.error("Failure", e, "Unable to retrieve running containers");
    });
  });

  function startContainer(containerID) {
    Container.start({id: containerID}, {}, function (cd) {
      if (cd.message) {
        $('#createContainerSpinner').hide();
        Notifications.error('Error', {}, cd.message);
      } else {
        $('#createContainerSpinner').hide();
        Notifications.success('Container Started', containerID);
        $state.go('containers', {}, {reload: true});
      }
    }, function (e) {
      $('#createContainerSpinner').hide();
      Notifications.error("Failure", e, 'Unable to start container');
    });
  }

  function createContainer(config) {
    Container.create(config, function (d) {
      if (d.message) {
        $('#createContainerSpinner').hide();
        Notifications.error('Error', {}, d.message);
      } else {
        if ($scope.formValues.Ownership === 'private') {
          ResourceControlService.setContainerResourceControl(Authentication.getUserDetails().ID, d.Id)
          .then(function success() {
            startContainer(d.Id);
          })
          .catch(function error(err) {
            $('#createContainerSpinner').hide();
            Notifications.error("Failure", err, 'Unable to apply resource control on container');
          });
        } else {
          startContainer(d.Id);
        }
      }
    }, function (e) {
      $('#createContainerSpinner').hide();
      Notifications.error("Failure", e, 'Unable to create container');
    });
  }

  function pullImageAndCreateContainer(config) {
    Image.create($scope.imageConfig, function (data) {
      createContainer(config);
    }, function (e) {
      $('#createContainerSpinner').hide();
      Notifications.error('Failure', e, 'Unable to pull image');
    });
  }

  function prepareImageConfig(config) {
    var image = config.Image;
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
      if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM') {
        containerName = $filter('swarmcontainername')(container);
      }
    }
    var networkMode = mode;
    if (containerName) {
      networkMode += ':' + containerName;
    }
    config.HostConfig.NetworkMode = networkMode;

    $scope.formValues.ExtraHosts.forEach(function (v) {
    if (v.value) {
        config.HostConfig.ExtraHosts.push(v.value);
      }
    });
  }

  function prepareLabels(config) {
    var labels = {};
    $scope.formValues.Labels.forEach(function (label) {
      if (label.name && label.value) {
        labels[label.name] = label.value;
      }
    });
    config.Labels = labels;
  }
  
  function prepareDevices(config) {
    var path = [];
    config.HostConfig.Devices.forEach(function (p) {
      if (p.pathOnHost) {
        if(p.pathInContainer === '') {
          p.pathInContainer = p.pathOnHost;
        }
        path.push({PathOnHost:p.pathOnHost,PathInContainer:p.pathInContainer,CgroupPermissions:'rwm'});  
      }
    });
    config.HostConfig.Devices = path; 
  }

  function prepareConfiguration() {
    var config = angular.copy($scope.config);
    config.Cmd = ContainerHelper.commandStringToArray(config.Cmd);
    prepareNetworkConfig(config);
    prepareImageConfig(config);
    preparePortBindings(config);
    prepareConsole(config);
    prepareEnvironmentVariables(config);
    prepareVolumes(config);
    prepareLabels(config);
    prepareDevices(config);
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
