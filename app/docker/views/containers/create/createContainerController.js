angular.module('portainer.docker')
.controller('CreateContainerController', ['$q', '$scope', '$state', '$timeout', '$transition$', '$filter', 'Container', 'ContainerHelper', 'Image', 'ImageHelper', 'Volume', 'NetworkService', 'ResourceControlService', 'Authentication', 'Notifications', 'ContainerService', 'ImageService', 'FormValidator', 'ModalService', 'RegistryService', 'SystemService', 'SettingsService',
function ($q, $scope, $state, $timeout, $transition$, $filter, Container, ContainerHelper, Image, ImageHelper, Volume, NetworkService, ResourceControlService, Authentication, Notifications, ContainerService, ImageService, FormValidator, ModalService, RegistryService, SystemService, SettingsService) {

  $scope.formValues = {
    alwaysPull: true,
    Console: 'none',
    Volumes: [],
    NetworkContainer: '',
    Labels: [],
    ExtraHosts: [],
    MacAddress: '',
    IPv4: '',
    IPv6: '',
    AccessControlData: new AccessControlFormData(),
    CpuLimit: 0,
    MemoryLimit: 0,
    MemoryReservation: 0
  };

  $scope.state = {
    formValidationError: '',
    actionInProgress: false
  };

  $scope.refreshSlider = function () {
    $timeout(function () {
      $scope.$broadcast('rzSliderForceRender');
    });
  };

  $scope.config = {
    Image: '',
    Env: [],
    Cmd: '',
    MacAddress: '',
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

  $scope.fromContainerMultipleNetworks = false;

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
    config.MacAddress = $scope.formValues.MacAddress;

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

  function prepareResources(config) {
    // Memory Limit - Round to 0.125
    var memoryLimit = (Math.round($scope.formValues.MemoryLimit * 8) / 8).toFixed(3);
    memoryLimit *= 1024 * 1024;
    if (memoryLimit > 0) {
      config.HostConfig.Memory = memoryLimit;
    }
    // Memory Resevation - Round to 0.125
    var memoryReservation = (Math.round($scope.formValues.MemoryReservation * 8) / 8).toFixed(3);
    memoryReservation *= 1024 * 1024;
    if (memoryReservation > 0) {
      config.HostConfig.MemoryReservation = memoryReservation;
    }
    // CPU Limit
    if ($scope.formValues.CpuLimit > 0) {
      config.HostConfig.NanoCpus = $scope.formValues.CpuLimit * 1000000000;
    }
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
    prepareResources(config);
    return config;
  }

  function confirmCreateContainer() {
    var deferred = $q.defer();
    Container.query({ all: 1, filters: {name: ['^/' + $scope.config.name + '$'] }}).$promise
    .then(function success(data) {
      var existingContainer = data[0];
      if (existingContainer) {
        ModalService.confirm({
          title: 'Are you sure ?',
          message: 'A container with the same name already exists. Portainer can automatically remove it and re-create one. Do you want to replace it?',
          buttons: {
            confirm: {
              label: 'Replace',
              className: 'btn-danger'
            }
          },
          callback: function onConfirm(confirmed) {
            if(!confirmed) { deferred.resolve(false); }
            else {
              // Remove old container
              ContainerService.remove(existingContainer, true)
              .then(function success(data) {
                Notifications.success('Container Removed', existingContainer.Id);
                deferred.resolve(true);
              })
              .catch(function error(err) {
                deferred.reject({ msg: 'Unable to remove container', err: err });
              });
            }
          }
        });
      } else {
        deferred.resolve(true);
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve containers');
      return undefined;
    });
    return deferred.promise;
  }

  function loadFromContainerCmd(d) {
    if ($scope.config.Cmd) {
      $scope.config.Cmd = ContainerHelper.commandArrayToString($scope.config.Cmd);
    } else {
      $scope.config.Cmd = '';
    }
  }

  function loadFromContainerPortBindings(d) {
    var bindings = [];
    for (var p in $scope.config.HostConfig.PortBindings) {
      if ({}.hasOwnProperty.call($scope.config.HostConfig.PortBindings, p)) {
	var hostPort = '';
        if ($scope.config.HostConfig.PortBindings[p][0].HostIp) {
          hostPort = $scope.config.HostConfig.PortBindings[p][0].HostIp + ':';
        }
        hostPort += $scope.config.HostConfig.PortBindings[p][0].HostPort;
        var b = {
          'hostPort': hostPort,
          'containerPort': p.split('/')[0],
          'protocol': p.split('/')[1]
        };
        bindings.push(b);
      }
    }
    $scope.config.HostConfig.PortBindings = bindings;
  }

  function loadFromContainerVolumes(d) {
    for (var v in d.Mounts) {
      if ({}.hasOwnProperty.call(d.Mounts, v)) {
        var mount = d.Mounts[v];
        var volume = {
          'type': mount.Type,
          'name': mount.Name || mount.Source,
          'containerPath': mount.Destination,
          'readOnly': mount.RW === false
        };
        $scope.formValues.Volumes.push(volume);
      }
    }
  }

  $scope.resetNetworkConfig = function() {
    $scope.config.NetworkingConfig = {
      EndpointsConfig: {}
    };
  };

  function loadFromContainerNetworkConfig(d) {
    $scope.config.NetworkingConfig = {
      EndpointsConfig: {}
    };
    var networkMode = d.HostConfig.NetworkMode;
    if (networkMode === 'default') {
      $scope.config.HostConfig.NetworkMode = 'bridge';
      if (!_.find($scope.availableNetworks, {'Name': 'bridge'})) {
        $scope.config.HostConfig.NetworkMode = 'nat';
      }
    }
    if ($scope.config.HostConfig.NetworkMode.indexOf('container:') === 0) {
      var netContainer = $scope.config.HostConfig.NetworkMode.split(/^container:/)[1];
      $scope.config.HostConfig.NetworkMode = 'container';
      for (var c in $scope.runningContainers) {
        if ($scope.runningContainers[c].Names && $scope.runningContainers[c].Names[0] === '/' + netContainer) {
          $scope.formValues.NetworkContainer = $scope.runningContainers[c];
        }
      }
    }
    $scope.fromContainerMultipleNetworks = Object.keys(d.NetworkSettings.Networks).length >= 2;
    if (d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode]) {
      if (d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].IPAMConfig) {
        if (d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].IPAMConfig.IPv4Address) {
          $scope.formValues.IPv4 = d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].IPAMConfig.IPv4Address;
        }
        if (d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].IPAMConfig.IPv6Address) {
          $scope.formValues.IPv6 = d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].IPAMConfig.IPv6Address;
        }
      }
    }
    $scope.config.NetworkingConfig.EndpointsConfig[$scope.config.HostConfig.NetworkMode] = d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode];
    // Mac Address
    $scope.formValues.MacAddress = d.NetworkSettings.Networks[$scope.config.HostConfig.NetworkMode].MacAddress;
    // ExtraHosts
    for (var h in $scope.config.HostConfig.ExtraHosts) {
      if ({}.hasOwnProperty.call($scope.config.HostConfig.ExtraHosts, h)) {
        $scope.formValues.ExtraHosts.push({'value': $scope.config.HostConfig.ExtraHosts[h]});
        $scope.config.HostConfig.ExtraHosts = [];
      }
    }
  }

  function loadFromContainerEnvironmentVariables(d) {
    var envArr = [];
    for (var e in $scope.config.Env) {
      if ({}.hasOwnProperty.call($scope.config.Env, e)) {
        var arr = $scope.config.Env[e].split(/\=(.+)/);
        envArr.push({'name': arr[0], 'value': arr[1]});
      }
    }
    $scope.config.Env = envArr;
  }

  function loadFromContainerLabels(d) {
    for (var l in $scope.config.Labels) {
      if ({}.hasOwnProperty.call($scope.config.Labels, l)) {
        $scope.formValues.Labels.push({ name: l, value: $scope.config.Labels[l]});
      }
    }
  }

  function loadFromContainerConsole(d) {
    if ($scope.config.OpenStdin && $scope.config.Tty) {
      $scope.formValues.Console = 'both';
    } else if (!$scope.config.OpenStdin && $scope.config.Tty) {
      $scope.formValues.Console = 'tty';
    } else if ($scope.config.OpenStdin && !$scope.config.Tty) {
      $scope.formValues.Console = 'interactive';
    } else if (!$scope.config.OpenStdin && !$scope.config.Tty) {
      $scope.formValues.Console = 'none';
    }
  }

  function loadFromContainerDevices(d) {
    var path = [];
    for (var dev in $scope.config.HostConfig.Devices) {
      if ({}.hasOwnProperty.call($scope.config.HostConfig.Devices, dev)) {
        var device = $scope.config.HostConfig.Devices[dev];
        path.push({'pathOnHost': device.PathOnHost, 'pathInContainer': device.PathInContainer});
      }
    }
    $scope.config.HostConfig.Devices = path;
  }

  function loadFromContainerImageConfig(d) {
    var imageInfo = ImageHelper.extractImageAndRegistryFromRepository($scope.config.Image);
    RegistryService.retrieveRegistryFromRepository($scope.config.Image)
    .then(function success(data) {
      if (data) {
        $scope.config.Image = imageInfo.image;
        $scope.formValues.Registry = data;
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrive registry');
    });
  }

  function loadFromContainerResources(d) {
    if (d.HostConfig.NanoCpus) {
      $scope.formValues.CpuLimit = d.HostConfig.NanoCpus / 1000000000;
    }
    if (d.HostConfig.Memory) {
      $scope.formValues.MemoryLimit = d.HostConfig.Memory / 1024 / 1024;
    }
    if (d.HostConfig.MemoryReservation) {
      $scope.formValues.MemoryReservation = d.HostConfig.MemoryReservation / 1024 / 1024;
    }
  }

  function loadFromContainerSpec() {
    // Get container
    Container.get({ id: $transition$.params().from }).$promise
    .then(function success(d) {
      var fromContainer = new ContainerDetailsViewModel(d);
      if (!fromContainer.ResourceControl) {
        $scope.formValues.AccessControlData.AccessControlEnabled = false;
      }
      $scope.fromContainer = fromContainer;
      $scope.config = ContainerHelper.configFromContainer(fromContainer.Model);
      loadFromContainerCmd(d);
      loadFromContainerPortBindings(d);
      loadFromContainerVolumes(d);
      loadFromContainerNetworkConfig(d);
      loadFromContainerEnvironmentVariables(d);
      loadFromContainerLabels(d);
      loadFromContainerConsole(d);
      loadFromContainerDevices(d);
      loadFromContainerImageConfig(d);
      loadFromContainerResources(d);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve container');
    });
  }

  function initView() {
    Volume.query({}, function (d) {
      $scope.availableVolumes = d.Volumes;
    }, function (e) {
      Notifications.error('Failure', e, 'Unable to retrieve volumes');
    });

    var provider = $scope.applicationState.endpoint.mode.provider;
    var apiVersion = $scope.applicationState.endpoint.apiVersion;
    NetworkService.networks(
      provider === 'DOCKER_STANDALONE' || provider === 'DOCKER_SWARM_MODE',
      false,
      provider === 'DOCKER_SWARM_MODE' && apiVersion >= 1.25,
      provider === 'DOCKER_SWARM'
    )
    .then(function success(data) {
      var networks = data;
      networks.push({ Name: 'container' });
      $scope.availableNetworks = networks;

      if (_.find(networks, {'Name': 'nat'})) {
        $scope.config.HostConfig.NetworkMode = 'nat';
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve networks');
    });

    Container.query({}, function (d) {
      var containers = d;
      $scope.runningContainers = containers;
      if ($transition$.params().from !== '') {
        loadFromContainerSpec();
      } else {
        $scope.fromContainer = {};
        $scope.formValues.Registry = {};
      }
    }, function(e) {
      Notifications.error('Failure', e, 'Unable to retrieve running containers');
    });

    SystemService.info()
    .then(function success(data) {
      $scope.state.sliderMaxCpu = 32;
      if (data.NCPU) {
        $scope.state.sliderMaxCpu = data.NCPU;
      }
      $scope.state.sliderMaxMemory = 32768;
      if (data.MemTotal) {
        $scope.state.sliderMaxMemory = Math.floor(data.MemTotal / 1000 / 1000);
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve engine details');
    });

    SettingsService.publicSettings()
    .then(function success(data) {
      $scope.allowBindMounts = data.AllowBindMountsForRegularUsers;
      $scope.allowPrivilegedMode = data.AllowPrivilegedModeForRegularUsers;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve application settings');
    });

    var userDetails = Authentication.getUserDetails();
    $scope.isAdmin = userDetails.role === 1;
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
    confirmCreateContainer()
    .then(function success(confirm) {
      if (!confirm) {
        return false;
      }

      var accessControlData = $scope.formValues.AccessControlData;
      var userDetails = Authentication.getUserDetails();
      var isAdmin = userDetails.role === 1;

      if (!validateForm(accessControlData, isAdmin)) {
        return;
      }

      $scope.state.actionInProgress = true;
      var config = prepareConfiguration();
      createContainer(config, accessControlData);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create container');
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
        $state.go('docker.containers', {}, {reload: true});
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to create container');
      })
      .finally(function final() {
        $scope.state.actionInProgress = false;
      });
    });
  }

  initView();
}]);
