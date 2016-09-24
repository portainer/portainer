angular.module('createService', [])
.controller('CreateServiceController', ['$scope', '$state', 'Service', 'Volume', 'Network', 'ImageHelper', 'Messages',
function ($scope, $state, Service, Volume, Network, ImageHelper, Messages) {

  $scope.formValues = {
    Name: '',
    Image: '',
    Registry: '',
    Mode: 'replicated',
    Replicas: 1,
    Command: '',
    WorkingDir: '',
    User: '',
    Env: [],
    Volumes: [],
    Network: '',
    ExtraNetworks: [],
    Ports: []
  };

  $scope.addPortBinding = function() {
    $scope.formValues.Ports.push({ PublishedPort: '', TargetPort: '', Protocol: 'tcp' });
  };

  $scope.removePortBinding = function(index) {
    $scope.formValues.Ports.splice(index, 1);
  };

  $scope.addExtraNetwork = function() {
    $scope.formValues.ExtraNetworks.push({ Name: '' });
  };

  $scope.removeExtraNetwork = function(index) {
    $scope.formValues.ExtraNetworks.splice(index, 1);
  };

  $scope.addVolume = function() {
    $scope.formValues.Volumes.push({ name: '', containerPath: '' });
  };

  $scope.removeVolume = function(index) {
    $scope.formValues.Volumes.splice(index, 1);
  };

  $scope.addEnvironmentVariable = function() {
    $scope.formValues.Env.push({ name: '', value: ''});
  };

  $scope.removeEnvironmentVariable = function(index) {
    $scope.formValues.Env.splice(index, 1);
  };

  function prepareImageConfig(config, input) {
    var imageConfig = ImageHelper.createImageConfig(input.Image, input.Registry);
    config.TaskTemplate.ContainerSpec.Image = imageConfig.repo + ':' + imageConfig.tag;
  }

  function preparePortsConfig(config, input) {
    var ports = [];
    input.Ports.forEach(function (binding) {
      if (binding.PublishedPort && binding.TargetPort) {
        ports.push({ PublishedPort: +binding.PublishedPort, TargetPort: +binding.TargetPort, Protocol: binding.Protocol });
      }
    });
    config.EndpointSpec.Ports = ports;
  }

  function prepareSchedulingConfig(config, input) {
    if (input.Mode === 'replicated') {
      config.Mode.Replicated = {
        Replicas: input.Replicas
      };
    } else {
      config.Mode.Global = {};
    }
  }

  function prepareCommandConfig(config, input) {
    if (input.Command) {
      config.TaskTemplate.ContainerSpec.Command = _.split(input.Command, ' ');
    }
    if (input.User) {
      config.TaskTemplate.ContainerSpec.User = input.User;
    }
    if (input.WorkingDir) {
      config.TaskTemplate.ContainerSpec.Dir = input.WorkingDir;
    }
  }

  function prepareEnvConfig(config, input) {
    var env = [];
    input.Env.forEach(function (v) {
      if (v.name && v.value) {
        env.push(v.name + "=" + v.value);
      }
    });
    config.TaskTemplate.ContainerSpec.Env = env;
  }

  function prepareVolumes(config, input) {
    input.Volumes.forEach(function (volume) {
      if (volume.Source && volume.Target) {
        var mount = {};
        mount.Type = volume.Bind ? 'bind' : 'volume';
        mount.ReadOnly = volume.ReadOnly ? true : false;
        mount.Source = volume.Source;
        mount.Target = volume.Target;
        config.TaskTemplate.ContainerSpec.Mounts.push(mount);
      }
    });
  }

  function prepareNetworks(config, input) {
    var networks = [];
    if (input.Network) {
      networks.push({ Target: input.Network });
    }
    input.ExtraNetworks.forEach(function (network) {
      networks.push({ Target: network.Name });
    });
    config.Networks = _.uniqWith(networks, _.isEqual);
  }

  function prepareConfiguration() {
    var input = $scope.formValues;
    var config = {
      Name: input.Name,
      TaskTemplate: {
        ContainerSpec: {
          Mounts: []
        }
      },
      Mode: {},
      EndpointSpec: {}
    };
    prepareSchedulingConfig(config, input);
    prepareImageConfig(config, input);
    preparePortsConfig(config, input);
    prepareCommandConfig(config, input);
    prepareEnvConfig(config, input);
    prepareVolumes(config, input);
    prepareNetworks(config, input);
    return config;
  }

  function createNewService(config) {
    Service.create(config, function (d) {
      $('#createServiceSpinner').hide();
      Messages.send('Service created', d.ID);
      $state.go('services', {}, {reload: true});
    }, function (e) {
      $('#createServiceSpinner').hide();
      Messages.error("Failure", e, 'Unable to create service');
    });
  }

  $scope.create = function createService() {
    $('#createServiceSpinner').show();
    var config = prepareConfiguration();
    createNewService(config);
  };

  Volume.query({}, function (d) {
    $scope.availableVolumes = d.Volumes;
  }, function (e) {
    Messages.error("Failure", e, "Unable to retrieve volumes");
  });

  Network.query({}, function (d) {
    $scope.availableNetworks = d.filter(function (network) {
      if (network.Scope === 'swarm') {
        return network;
      }
    });
  }, function (e) {
    Messages.error("Failure", e, "Unable to retrieve networks");
  });
}]);
