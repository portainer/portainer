export default function prepareConfiguration() {
  let prepareNetworkConfig = (config) => {
    var mode = config.HostConfig.NetworkMode;
    var container = this.formValues.NetworkContainer;
    var containerName = container;
    if (container && typeof container === 'object') {
      containerName = this.$filter('trimcontainername')(container.Names[0]);
    }
    var networkMode = mode;
    if (containerName) {
      networkMode += ':' + containerName;
      config.Hostname = '';
    }
    config.HostConfig.NetworkMode = networkMode;
    config.MacAddress = this.formValues.MacAddress;

    config.NetworkingConfig.EndpointsConfig[networkMode] = {
      IPAMConfig: {
        IPv4Address: this.formValues.IPv4,
        IPv6Address: this.formValues.IPv6
      }
    };

    for (const v of this.formValues.ExtraHosts) {
      if (v.value) {
        config.HostConfig.ExtraHosts.push(v.value);
      }
    }
  };

  let prepareImageConfig = (config) => {
    var image = config.Image;
    var registry = this.formValues.Registry;
    var imageConfig = this.ImageHelper.createImageConfigForContainer(image, registry.URL);
    config.Image = imageConfig.fromImage + ':' + imageConfig.tag;
    this.imageConfig = imageConfig;
  };

  let preparePortBindings = (config) => {
    var bindings = {};
    for (const portBinding of config.HostConfig.PortBindings) {
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
    }
    config.HostConfig.PortBindings = bindings;
  };

  let prepareConsole = (config) => {
    var value = this.formValues.Console;
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
  };

  let prepareEnvironmentVariables = (config) => {
    var env = [];
    for (const v of config.Env) {
      if (v.name && v.value) {
        env.push(v.name + '=' + v.value);
      }
    }
    config.Env = env;
  };

  let prepareVolumes = (config) => {
    var binds = [];
    var volumes = {};

    for (const volume of this.formValues.Volumes) {
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
    }
    config.HostConfig.Binds = binds;
    config.Volumes = volumes;
  };

  let prepareLabels = (config) => {
    var labels = {};
    for (const label of this.formValues.Labels) {
      if (label.name && label.value) {
        labels[label.name] = label.value;
      }
    }
    config.Labels = labels;
  };

  let prepareDevices = (config) => {
    var path = [];
    for (const p of config.HostConfig.Devices) {
      if (p.pathOnHost) {
        if(p.pathInContainer === '') {
          p.pathInContainer = p.pathOnHost;
        }
        path.push({PathOnHost:p.pathOnHost,PathInContainer:p.pathInContainer,CgroupPermissions:'rwm'});
      }
    }
    config.HostConfig.Devices = path;
  };

  let prepareResources = (config) => {
    // Memory Limit - Round to 0.125
    var memoryLimit = (Math.round(this.formValues.MemoryLimit * 8) / 8).toFixed(3);
    memoryLimit *= 1024 * 1024;
    if (memoryLimit > 0) {
      config.HostConfig.Memory = memoryLimit;
    }
    // Memory Resevation - Round to 0.125
    var memoryReservation = (Math.round(this.formValues.MemoryReservation * 8) / 8).toFixed(3);
    memoryReservation *= 1024 * 1024;
    if (memoryReservation > 0) {
      config.HostConfig.MemoryReservation = memoryReservation;
    }
    // CPU Limit
    if (this.formValues.CpuLimit > 0) {
      config.HostConfig.NanoCpus = this.formValues.CpuLimit * 1000000000;
    }
  };

  let prepareLogDriver = (config) => {
    var logOpts = {};
    if (this.formValues.LogDriverName) {
      config.HostConfig.LogConfig = { Type: this.formValues.LogDriverName };
      if (this.formValues.LogDriverName !== 'none') {
        for (const opt of this.formValues.LogDriverOpts) {
          if (opt.name) {
            logOpts[opt.name] = opt.value;
          }
        }
        if (Object.keys(logOpts).length !== 0 && logOpts.constructor === Object) {
          config.HostConfig.LogConfig.Config = logOpts;
        }
      }
    }
  };

  let prepareCapabilities = (config) => {
    var allowed = this.formValues.capabilities.filter(function(item) {return item.allowed === true;});
    var notAllowed = this.formValues.capabilities.filter(function(item) {return item.allowed === false;});

    var getCapName = function(item) {return item.capability;};
    config.HostConfig.CapAdd = allowed.map(getCapName);
    config.HostConfig.CapDrop = notAllowed.map(getCapName);
  };

  var config = angular.copy(this.config);
  config.Cmd = this.ContainerHelper.commandStringToArray(config.Cmd);
  prepareNetworkConfig(config);
  prepareImageConfig(config);
  preparePortBindings(config);
  prepareConsole(config);
  prepareEnvironmentVariables(config);
  prepareVolumes(config);
  prepareLabels(config);
  prepareDevices(config);
  prepareResources(config);
  prepareLogDriver(config);
  prepareCapabilities(config);
  return config;
}

