// @@OLD_SERVICE_CONTROLLER: this service should be rewritten to use services.
// See app/components/templates/templatesController.js as a reference.
angular.module('createContainer', [])
.controller('CreateContainerController', ['$q', '$scope', '$state', '$stateParams', '$filter', 'Container', 'ContainerHelper', 'Image', 'ImageHelper', 'Volume', 'Network', 'ResourceControlService', 'Authentication', 'Notifications', 'ContainerService', 'ImageService', 'ControllerDataPipeline', 'FormValidator', 'ModalService',
function ($q, $scope, $state, $stateParams, $filter, Container, ContainerHelper, Image, ImageHelper, Volume, Network, ResourceControlService, Authentication, Notifications, ContainerService, ImageService, ControllerDataPipeline, FormValidator, ModalService) {

  $scope.formValues = {
    alwaysPull: true,
    Console: 'none',
    Volumes: [],
    Registry: '',
    NetworkContainer: '',
    Labels: [],
    ExtraHosts: [],
    IPv4: '',
    IPv6: ''
  };

  $scope.state = {
    formValidationError: ''
  };

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
    NetworkingConfig: {
      EndpointsConfig: {}
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

  function prepareImageConfig(config) {
    var image = config.Image;
    var registry = $scope.formValues.Registry;
    var imageConfig = ImageHelper.createImageConfigForContainer(image, registry.URL);
    config.Image = imageConfig.fromImage + ':' + imageConfig.tag;
    $scope.imageConfig = imageConfig;
  }

  function preparePortBindings(config) {
    var bindings = {};
    config.HostConfig.PortBindings.forEach(function (portBinding) {
      if (portBinding.containerPort) {
        var key = portBinding.containerPort + '/' + portBinding.protocol;
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
        env.push(v.name + '=' + v.value);
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
      config.Hostname = '';
    }
    config.HostConfig.NetworkMode = networkMode;

    config.NetworkingConfig.EndpointsConfig[networkMode] = {
      IPAMConfig: {
        IPv4Address: $scope.formValues.IPv4,
        IPv6Address: $scope.formValues.IPv6
      }
    };

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

  function confirmCreateContainer(cb) {
    Container.query({
      all: 1,
      filters: {name: [$scope.config.name]}
    }, function (data) {
      var confirmDialog = false;
      var containerId;
      // Prompt if we found name to confirm replacement
      for (var c in data) {
        for (var n in data[c].Names) {
          if (data[c].Names[n] === '/' + $scope.config.name) {
            confirmDialog = true;
            containerId = data[c].Id;
          }
        }
      }
      if (confirmDialog) {
        ModalService.confirmDeletion(
          'A container with the same name is already present on this host. Do you want to remove it?',
          function onConfirm(confirmed) {
            if(!confirmed) { cb(false); }
            else {
              // Remove old container
              Container.remove({id: containerId, v: 0, force: true}, function(d) {
                if (d.message) {
                  Notifications.error("Error", d, "Unable to remove container");
                  cb(false);
                } else {
                  if (c.Metadata && c.Metadata.ResourceControl) {
                    ResourceControlService.removeContainerResourceControl(c.Metadata.ResourceControl.OwnerId, containerId)
                    .then(function success() {
                      Notifications.success("Container Removed", containerId);
                      cb(true);
                    })
                    .catch(function error(err) {
                      Notifications.error("Failure", err, "Unable to remove container ownership");
                      cb(false);
                    });
                  } else {
                    Notifications.success("Container Removed", containerId);
                    cb(true);
                  }
                }
              });
            }
          }
        );
      } else {
        cb(true);
      }
    }, function error(err) {
      cb(false);
      Notifications.error("Failure", err, "Unable to retrieve containers");
    });
  }

  function loadFromContainerSpec() {
    // Get container
    Container.get({id: $stateParams.from}, function(d) {
      // Add Config
      $scope.config = d.Config;
      if ($scope.config.Cmd) {
        $scope.config.Cmd = ContainerHelper.commandArrayToString($scope.config.Cmd);
      }
      // Add HostConfig
      $scope.config.HostConfig = d.HostConfig;
      // Add Ports
      var bindings = [];
      for (var p in $scope.config.HostConfig.PortBindings) {
        var b = {
          "hostPort": $scope.config.HostConfig.PortBindings[p][0].HostPort,
          "containerPort": p.split('/')[0],
          "protocol": p.split('/')[1]
        };
        bindings.push(b);
      }
      $scope.config.HostConfig.PortBindings = bindings;
      // Add volumes
      for (var v in d.Mounts) {
        var mount = d.Mounts[v];
        var volume = {
          "type": mount.Type,
          "name": mount.Name || mount.Source,
          "containerPath": mount.Destination,
          "readOnly": mount.RW === false
        };
        /*if (arr[0].indexOf('/') === 0) {
          volume.type = "bind";
        }
        if (arr[2] && arr[2] === 'ro') {
          volume.readOnly = true;
        }*/
        $scope.formValues.Volumes.push(volume);
      }
      // Add network
      $scope.config.NetworkingConfig = {
        EndpointsConfig: {}
      };
      if ($scope.config.HostConfig.NetworkMode.indexOf('container:') === 0) {
        $scope.config.HostConfig.NetworkMode = 'container';
        $scope.formValues.NetworkContainer = $scope.config.HostConfig.NetworkMode.split(/^container:/)[1];
      }
      if (d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].IPAMConfig) {
        if (d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].IPAMConfig.IPv4Address) {
          $scope.formValues.IPv4 = d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].IPAMConfig.IPv4Address;
        }
        if (d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].IPAMConfig.IPv6Address) {
          $scope.formValues.IPv6 = d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].IPAMConfig.IPv6Address;
        }
      }
      $scope.config.NetworkingConfig.EndpointsConfig = d.NetworkSettings.Networks;

      // Add Env
      var envArr = [];
      for (var e in $scope.config.Env) {
        var arr = $scope.config.Env[e].split(/=(.+)/);
        envArr.push({"name": arr[0], "value": arr[1]});
      }
      $scope.config.Env = envArr;

      // Add ExtraHost
      for (var h in $scope.config.HostConfig.ExtraHosts) {
        $scope.formValues.ExtraHosts.push({"value": $scope.config.HostConfig.ExtraHosts[h]});
        $scope.config.HostConfig.ExtraHosts = [];
      }

      // Add labels
      for (var l in $scope.config.Labels) {
        $scope.formValues.Labels.push({ name: l, value: $scope.config.Labels[l]});
      }

      // Add Console
      if ($scope.config.OpenStdin && $scope.config.Tty) {
        $scope.formValues.Console = 'both';
      } else if (!$scope.config.OpenStdin && $scope.config.Tty) {
        $scope.formValues.Console = 'tty';
      } else if ($scope.config.OpenStdin && !$scope.config.Tty) {
        $scope.formValues.Console = 'interactive';
      } else if (!$scope.config.OpenStdin && !$scope.config.Tty) {
        $scope.formValues.Console = 'none';
      }

      // Add Devices
      var path = [];
      for (var dev in $scope.config.HostConfig.Devices) {
        var device = $scope.config.HostConfig.Devices[dev];
        path.push({"pathOnHost": device.PathOnHost, "pathInContainer": device.PathInContainer});
      }
      $scope.config.HostConfig.Devices = path;

      // Add Ownership
      /*if (d.Portainer && d.Portainer.ResourceControl) {
        ControllerDataPipeline.setAccessControlFormData(....);
      }*/
  //};

      // Add name
      $scope.config.name = d.Name.replace(/^\//g, '');
    });
  }

  function initView() {
	  // If we got a template, we prefill fields
    if ($stateParams.from !== '') {
      loadFromContainerSpec();
    }

    Volume.query({}, function (d) {
      $scope.availableVolumes = d.Volumes;
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to retrieve volumes');
    });

    Network.query({}, function (d) {
      var networks = d;
      if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM' || $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
        if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM') {
          networks = d.filter(function (network) {
            if (network.Scope === 'global') {
              return network;
            }
          });
        }
        if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
          networks = d.filter(function (network) {
            return network.Driver !== 'overlay' || network.Attachable;
          });
        }
        $scope.globalNetworkCount = networks.length;
        networks.push({Name: 'bridge'});
        networks.push({Name: 'host'});
        networks.push({Name: 'none'});
      }
      networks.push({Name: 'container'});
      $scope.availableNetworks = networks;
      if (!_.find(networks, {'Name': 'bridge'})) {
        $scope.config.HostConfig.NetworkMode = 'nat';
      }
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to retrieve networks');
    });

    Container.query({}, function (d) {
      var containers = d;
      $scope.runningContainers = containers;
    }, function(e) {
      Notifications.error('Failure', e, 'Unable to retrieve running containers');
    });

  }

  function validateForm(accessControlData, isAdmin) {
    $scope.state.formValidationError = '';
    var error = '';
    error = FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      $scope.state.formValidationError = error;
      return false;
    }
    return true;
  }

  $scope.create = function () {
    confirmCreateContainer(function(doIt) {
      if (doIt) {
        $('#createContainerSpinner').show();

        var accessControlData = ControllerDataPipeline.getAccessControlFormData();
        var userDetails = Authentication.getUserDetails();
        var isAdmin = userDetails.role === 1 ? true : false;

        if (!validateForm(accessControlData, isAdmin)) {
          $('#createContainerSpinner').hide();
          return;
        }

        var config = prepareConfiguration();
        createContainer(config, accessControlData);
      }
    });
  };

  function createContainer(config, accessControlData) {
    $q.when(!$scope.formValues.alwaysPull || ImageService.pullImage($scope.config.Image, $scope.formValues.Registry, true))
    .finally(function final() {
      ContainerService.createAndStartContainer(config)
      .then(function success(data) {
        var containerIdentifier = data.Id;
        var userId = Authentication.getUserDetails().ID;
        return ResourceControlService.applyResourceControl('container', containerIdentifier, userId, accessControlData, []);
      })
      .then(function success() {
        Notifications.success('Container successfully created');
        $state.go('containers', {}, {reload: true});
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to create container');
      })
      .finally(function final() {
        $('#createContainerSpinner').hide();
      });
    });
  }

  initView();
}]);
