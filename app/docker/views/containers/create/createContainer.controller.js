import angular from 'angular';
import _ from 'lodash-es';
import { ContainerCapabilities, ContainerCapability } from 'Docker/models/containerCapabilities';
import { AccessControlFormData } from 'Portainer/components/accessControlForm/porAccessControlFormModel';
import { ContainerDetailsViewModel } from 'Docker/models/container';
import * as UIActions from './createContainer.UIactions';
import createContainer from './createContainer.function';
import prepareConfiguration from './prepareConfiguration.function';

class CreateContainerController {
  /* @ngInject */
  constructor($q, $scope, $state, $timeout, $transition$, $filter, ContainerHelper, ImageHelper, VolumeService, NetworkService, ResourceControlService, Authentication, Notifications, ContainerService, ImageService, FormValidator, ModalService, RegistryService, SystemService, SettingsService, PluginService, HttpRequestHelper) {
    this.$q = $q;
    this.$scope = $scope; // TODO : Remove this temporary scope save for ApplicationState
    this.$state = $state;
    this.$timeout = $timeout;
    this.$transition$ = $transition$;
    this.$filter = $filter;
    this.ContainerHelper = ContainerHelper;
    this.ImageHelper = ImageHelper;
    this.HttpRequestHelper = HttpRequestHelper;
    this.VolumeService = VolumeService;
    this.NetworkService = NetworkService;
    this.ContainerService = ContainerService;
    this.ImageService = ImageService;
    this.RegistryService = RegistryService;
    this.ResourceControlService = ResourceControlService;
    this.SystemService = SystemService;
    this.SettingsService = SettingsService;
    this.PluginService = PluginService;
    this.Authentication = Authentication;
    this.Notifications = Notifications;
    this.FormValidator = FormValidator;
    this.ModalService = ModalService;

    this.formValues = {
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
      MemoryReservation: 0,
      NodeName: null,
      capabilities: [],
      LogDriverName: '',
      LogDriverOpts: []
    };

    this.extraNetworks = {};

    this.state = {
      formValidationError: '',
      actionInProgress: false
    };

    this.config = {
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
        AutoRemove: false,
        NetworkMode: 'bridge',
        Privileged: false,
        Runtime: '',
        ExtraHosts: [],
        Devices: [],
        CapAdd: [],
        CapDrop: []
      },
      NetworkingConfig: {
        EndpointsConfig: {}
      },
      Labels: {}
    };

    this.fromContainerMultipleNetworks = false;
    // bind partial-class functions to the controller
    this.createContainer = createContainer;
    this.prepareConfiguration = prepareConfiguration;
  }

  refreshSlider() {
    this.$timeout(function () {
      this.$broadcast('rzSliderForceRender');
    });
  }


  loadFromContainerCmd() {
    if (this.config.Cmd) {
      this.config.Cmd = this.ContainerHelper.commandArrayToString(this.config.Cmd);
    } else {
      this.config.Cmd = '';
    }
  }

  loadFromContainerPortBindings() {
    var bindings = [];
    for (var p in this.config.HostConfig.PortBindings) {
      if ({}.hasOwnProperty.call(this.config.HostConfig.PortBindings, p)) {
        var hostPort = '';
        if (this.config.HostConfig.PortBindings[p][0].HostIp) {
          hostPort = this.config.HostConfig.PortBindings[p][0].HostIp + ':';
        }
        hostPort += this.config.HostConfig.PortBindings[p][0].HostPort;
        var b = {
          'hostPort': hostPort,
          'containerPort': p.split('/')[0],
          'protocol': p.split('/')[1]
        };
        bindings.push(b);
      }
    }
    this.config.HostConfig.PortBindings = bindings;
  }

  loadFromContainerVolumes(d) {
    for (var v in d.Mounts) {
      if ({}.hasOwnProperty.call(d.Mounts, v)) {
        var mount = d.Mounts[v];
        var volume = {
          'type': mount.Type,
          'name': mount.Name || mount.Source,
          'containerPath': mount.Destination,
          'readOnly': mount.RW === false
        };
        this.formValues.Volumes.push(volume);
      }
    }
  }

  resetNetworkConfig() {
    this.config.NetworkingConfig = {
      EndpointsConfig: {}
    };
  }

  loadFromContainerNetworkConfig(d) {
    this.config.NetworkingConfig = {
      EndpointsConfig: {}
    };
    var networkMode = d.HostConfig.NetworkMode;
    if (networkMode === 'default') {
      this.config.HostConfig.NetworkMode = 'bridge';
      if (!_.find(this.availableNetworks, {'Name': 'bridge'})) {
        this.config.HostConfig.NetworkMode = 'nat';
      }
    }
    if (this.config.HostConfig.NetworkMode.indexOf('container:') === 0) {
      var netContainer = this.config.HostConfig.NetworkMode.split(/^container:/)[1];
      this.config.HostConfig.NetworkMode = 'container';
      for (var c in this.runningContainers) {
        if (this.runningContainers[c].Names && this.runningContainers[c].Names[0] === '/' + netContainer) {
          this.formValues.NetworkContainer = this.runningContainers[c];
        }
      }
    }
    this.fromContainerMultipleNetworks = Object.keys(d.NetworkSettings.Networks).length >= 2;
    if (d.NetworkSettings.Networks[this.config.HostConfig.NetworkMode]) {
      if (d.NetworkSettings.Networks[this.config.HostConfig.NetworkMode].IPAMConfig) {
        if (d.NetworkSettings.Networks[this.config.HostConfig.NetworkMode].IPAMConfig.IPv4Address) {
          this.formValues.IPv4 = d.NetworkSettings.Networks[this.config.HostConfig.NetworkMode].IPAMConfig.IPv4Address;
        }
        if (d.NetworkSettings.Networks[this.config.HostConfig.NetworkMode].IPAMConfig.IPv6Address) {
          this.formValues.IPv6 = d.NetworkSettings.Networks[this.config.HostConfig.NetworkMode].IPAMConfig.IPv6Address;
        }
      }
    }
    this.config.NetworkingConfig.EndpointsConfig[this.config.HostConfig.NetworkMode] = d.NetworkSettings.Networks[this.config.HostConfig.NetworkMode];
    // Mac Address
    if(Object.keys(d.NetworkSettings.Networks).length) {
      var firstNetwork = d.NetworkSettings.Networks[Object.keys(d.NetworkSettings.Networks)[0]];
      this.formValues.MacAddress = firstNetwork.MacAddress;
      this.config.NetworkingConfig.EndpointsConfig[this.config.HostConfig.NetworkMode] = firstNetwork;
      this.extraNetworks = angular.copy(d.NetworkSettings.Networks);
      delete this.extraNetworks[Object.keys(d.NetworkSettings.Networks)[0]];
    } else {
      this.formValues.MacAddress = '';
    }

    // ExtraHosts
    if (this.config.HostConfig.ExtraHosts) {
      var extraHosts = this.config.HostConfig.ExtraHosts;
      for (var i = 0; i < extraHosts.length; i++) {
        var host = extraHosts[i];
        this.formValues.ExtraHosts.push({ 'value': host });
      }
      this.config.HostConfig.ExtraHosts = [];
    }
  }

  loadFromContainerEnvironmentVariables() {
    var envArr = [];
    for (var e in this.config.Env) {
      if ({}.hasOwnProperty.call(this.config.Env, e)) {
        var arr = this.config.Env[e].split(/\=(.+)/);
        envArr.push({'name': arr[0], 'value': arr[1]});
      }
    }
    this.config.Env = envArr;
  }

  loadFromContainerLabels() {
    for (var l in this.config.Labels) {
      if ({}.hasOwnProperty.call(this.config.Labels, l)) {
        this.formValues.Labels.push({ name: l, value: this.config.Labels[l]});
      }
    }
  }

  loadFromContainerConsole() {
    if (this.config.OpenStdin && this.config.Tty) {
      this.formValues.Console = 'both';
    } else if (!this.config.OpenStdin && this.config.Tty) {
      this.formValues.Console = 'tty';
    } else if (this.config.OpenStdin && !this.config.Tty) {
      this.formValues.Console = 'interactive';
    } else if (!this.config.OpenStdin && !this.config.Tty) {
      this.formValues.Console = 'none';
    }
  }

  loadFromContainerDevices() {
    var path = [];
    for (var dev in this.config.HostConfig.Devices) {
      if ({}.hasOwnProperty.call(this.config.HostConfig.Devices, dev)) {
        var device = this.config.HostConfig.Devices[dev];
        path.push({'pathOnHost': device.PathOnHost, 'pathInContainer': device.PathInContainer});
      }
    }
    this.config.HostConfig.Devices = path;
  }

  loadFromContainerImageConfig() {
    var imageInfo = this.ImageHelper.extractImageAndRegistryFromRepository(this.config.Image);
    this.RegistryService.retrieveRegistryFromRepository(this.config.Image)
    .then(function success(data) {
      if (data) {
        this.config.Image = imageInfo.image;
        this.formValues.Registry = data;
      }
    })
    .catch(function error(err) {
      this.Notifications.error('Failure', err, 'Unable to retrive registry');
    });
  }

  loadFromContainerResources(d) {
    if (d.HostConfig.NanoCpus) {
      this.formValues.CpuLimit = d.HostConfig.NanoCpus / 1000000000;
    }
    if (d.HostConfig.Memory) {
      this.formValues.MemoryLimit = d.HostConfig.Memory / 1024 / 1024;
    }
    if (d.HostConfig.MemoryReservation) {
      this.formValues.MemoryReservation = d.HostConfig.MemoryReservation / 1024 / 1024;
    }
  }

  loadFromContainerCapabilities(d) {
    if (d.HostConfig.CapAdd) {
      for (const cap of d.HostConfig.CapAdd) {
        this.formValues.capabilities.push(new ContainerCapability(cap, true));
      }
    }
    if (d.HostConfig.CapDrop) {
      for (const cap of d.HostConfig.CapDrop) {
        this.formValues.capabilities.push(new ContainerCapability(cap, false));
      }
    }

    var capabilities = new ContainerCapabilities();
    for (var i = 0; i < capabilities.length; i++) {
      var cap = capabilities[i];
      if (!_.find(this.formValues.capabilities, (item) => item.capability === cap.capability)) {
        this.formValues.capabilities.push(cap);
      }
    }

    this.formValues.capabilities.sort((a, b) => a.capability < b.capability ? -1 : 1);
  }

  loadFromContainerSpec() {
    // Get container
    this.Container.get({ id: this.$transition$.params().from }).$promise
    .then(function success(d) {
      var fromContainer = new ContainerDetailsViewModel(d);
      if (fromContainer.ResourceControl && fromContainer.ResourceControl.Public) {
        this.formValues.AccessControlData.AccessControlEnabled = false;
      }
      this.fromContainer = fromContainer;
      this.config = this.ContainerHelper.configFromContainer(fromContainer.Model);
      this.loadFromContainerCmd(d);
      this.loadFromContainerLogging(d);
      this.loadFromContainerPortBindings(d);
      this.loadFromContainerVolumes(d);
      this.loadFromContainerNetworkConfig(d);
      this.loadFromContainerEnvironmentVariables(d);
      this.loadFromContainerLabels(d);
      this.loadFromContainerConsole(d);
      this.loadFromContainerDevices(d);
      this.loadFromContainerImageConfig(d);
      this.loadFromContainerResources(d);
      this.loadFromContainerCapabilities(d);
    })
    .catch(function error(err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve container');
    });
  }

  loadFromContainerLogging(config) {
    var logConfig = config.HostConfig.LogConfig;
    this.formValues.LogDriverName = logConfig.Type;
    this.formValues.LogDriverOpts = _.map(logConfig.Config, function (value, name) {
      return {
        name: name,
        value: value
      };
    });
  }

  initUIActions() {
    for (const func in UIActions) {
      this[func] = UIActions[func];
    }
  }

  async $onInit() {
    this.initUIActions();
    var nodeName = this.$transition$.params().nodeName;
    this.formValues.NodeName = nodeName;
    this.HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);
    try {
      let data = await this.VolumeService.volumes({});
      this.availableVolumes = data.Volumes;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve volumes');
    }

    var provider = this.$scope.applicationState.endpoint.mode.provider;
    var apiVersion = this.$scope.applicationState.endpoint.apiVersion;
    try {
      let data = await this.NetworkService.networks(
        provider === 'DOCKER_STANDALONE' || provider === 'DOCKER_SWARM_MODE',
        false,
        provider === 'DOCKER_SWARM_MODE' && apiVersion >= 1.25
      );
      var networks = data;
      networks.push({ Name: 'container' });
      this.availableNetworks = networks;

      if (_.find(networks, {'Name': 'nat'})) {
        this.config.HostConfig.NetworkMode = 'nat';
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve networks');
    }

    try {
      this.runningContainers = await this.ContainerService.containers();
      if (this.$transition$.params().from) {
        this.loadFromContainerSpec();
      } else {
        this.fromContainer = {};
        this.formValues.Registry = {};
        this.formValues.capabilities = new ContainerCapabilities();
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve running containers');
    }

    try {
      let data = await this.SystemService.info();
      this.availableRuntimes = Object.keys(data.Runtimes);
      this.config.HostConfig.Runtime = '';
      this.state.sliderMaxCpu = 32;
      if (data.NCPU) {
        this.state.sliderMaxCpu = data.NCPU;
      }
      this.state.sliderMaxMemory = 32768;
      if (data.MemTotal) {
        this.state.sliderMaxMemory = Math.floor(data.MemTotal / 1000 / 1000);
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve engine details');
    }


    try {
      let data = await this.SettingsService.publicSettings();
      this.allowBindMounts = data.AllowBindMountsForRegularUsers;
      this.allowPrivilegedMode = data.AllowPrivilegedModeForRegularUsers;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve application settings');
    }

    try {
      this.availableLoggingDrivers = await this.PluginService.loggingPlugins(apiVersion < 1.25);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load logging plugins');
    }

    var userDetails = this.Authentication.getUserDetails();
    this.isAdmin = userDetails.role === 1;
  }

  validateForm(accessControlData, isAdmin) {
    this.state.formValidationError = '';
    var error = '';
    error = this.FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      this.state.formValidationError = error;
      return false;
    }
    return true;
  }

}

export default CreateContainerController;
angular.module('portainer.docker').controller('CreateContainerController', CreateContainerController);
