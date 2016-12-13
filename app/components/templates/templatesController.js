angular.module('templates', [])
.controller('TemplatesController', ['$scope', '$q', '$state', '$filter', '$anchorScroll', 'Config', 'Info', 'Container', 'ContainerHelper', 'Image', 'Volume', 'Network', 'Templates', 'TemplateHelper', 'Messages', 'Settings',
function ($scope, $q, $state, $filter, $anchorScroll, Config, Info, Container, ContainerHelper, Image, Volume, Network, Templates, TemplateHelper, Messages, Settings) {
  $scope.state = {
    selectedTemplate: null,
    showAdvancedOptions: false
  };
  $scope.formValues = {
    network: "",
    name: "",
    ports: []
  };
  $scope.pagination_count = Settings.pagination_count;

  var selectedItem = -1;

  $scope.addPortBinding = function() {
    $scope.formValues.ports.push({ hostPort: '', containerPort: '', protocol: 'tcp' });
  };

  $scope.removePortBinding = function(index) {
    $scope.formValues.ports.splice(index, 1);
  };

  // TODO: centralize, already present in createContainerController
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


  // TODO: centralize, already present in createContainerController
  function pullImageAndCreateContainer(imageConfig, containerConfig) {
    Image.create(imageConfig, function (data) {
      var err = data.length > 0 && data[data.length - 1].hasOwnProperty('error');
      if (err) {
        var detail = data[data.length - 1];
        $('#createContainerSpinner').hide();
        Messages.error("Error", {}, detail.error);
      } else {
        createContainer(containerConfig);
      }
    }, function (e) {
      $('#createContainerSpinner').hide();
      Messages.error("Failure", e, "Unable to pull image");
    });
  }

  function getInitialConfiguration() {
    return {
      Env: [],
      OpenStdin: false,
      Tty: false,
      ExposedPorts: {},
      HostConfig: {
        RestartPolicy: {
          Name: 'no'
        },
        PortBindings: {},
        Binds: [],
        NetworkMode: $scope.formValues.network.Name,
        Privileged: false
      },
      Volumes: {},
      name: $scope.formValues.name
    };
  }

  function preparePortBindings(config, ports) {
    var bindings = {};
    ports.forEach(function (portBinding) {
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

  function createConfigFromTemplate(template) {
    var containerConfig = getInitialConfiguration();
    containerConfig.Image = template.image;
    if (template.env) {
      template.env.forEach(function (v) {
        if (v.value || v.set) {
          var val;
          if (v.type && v.type === 'container') {
            if ($scope.swarm && $scope.formValues.network.Scope === 'global') {
              val = $filter('swarmcontainername')(v.value);
            } else {
              var container = v.value;
              val = container.NetworkSettings.Networks[Object.keys(container.NetworkSettings.Networks)[0]].IPAddress;
            }
          } else {
            val = v.set ? v.set : v.value;
          }
          containerConfig.Env.push(v.name + "=" + val);
        }
      });
    }
    preparePortBindings(containerConfig, $scope.formValues.ports);
    return containerConfig;
  }

  function prepareVolumeQueries(template, containerConfig) {
    var volumeQueries = [];
    if (template.volumes) {
      template.volumes.forEach(function (vol) {
        volumeQueries.push(
          Volume.create({}, function (d) {
            if (d.message) {
              Messages.error("Unable to create volume", {}, d.message);
            } else {
              Messages.send("Volume created", d.Name);
              containerConfig.Volumes[vol] = {};
              containerConfig.HostConfig.Binds.push(d.Name + ':' + vol);
            }
          }, function (e) {
            Messages.error("Failure", e, "Unable to create volume");
          }).$promise
        );
      });
    }
    return volumeQueries;
  }

  $scope.createTemplate = function() {
    $('#createContainerSpinner').show();
    var template = $scope.state.selectedTemplate;
    var containerConfig = createConfigFromTemplate(template);
    var imageConfig = {
      fromImage: template.image.split(':')[0],
      tag: template.image.split(':')[1] ? template.image.split(':')[1] : 'latest'
    };
    var createVolumeQueries = prepareVolumeQueries(template, containerConfig);
    $q.all(createVolumeQueries).then(function (d) {
      pullImageAndCreateContainer(imageConfig, containerConfig);
    });
  };

  $scope.selectTemplate = function(id) {
    $('#template_' + id).toggleClass("container-template--selected");
    if (selectedItem === id) {
      selectedItem = -1;
      $scope.state.selectedTemplate = null;
    } else {
      $('#template_' + selectedItem).toggleClass("container-template--selected");
      selectedItem = id;
      var selectedTemplate = $scope.templates[id];
      $scope.state.selectedTemplate = selectedTemplate;
      $scope.formValues.ports = selectedTemplate.ports ? TemplateHelper.getPortBindings(selectedTemplate.ports) : [];
      $anchorScroll('selectedTemplate');
    }
  };

  function initTemplates() {
    Templates.get(function (data) {
      $scope.templates = data.map(function(tpl,index){
        tpl.index = index;
        return tpl;
      });
      $('#loadTemplatesSpinner').hide();
    }, function (e) {
      $('#loadTemplatesSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve apps list");
      $scope.templates = [];
    });
  }

  Config.$promise.then(function (c) {
    $scope.swarm = c.swarm;
    var containersToHideLabels = c.hiddenLabels;
    Network.query({}, function (d) {
      var networks = d;
      if ($scope.swarm) {
        networks = d.filter(function (network) {
          if (network.Scope === 'global') {
            return network;
          }
        });
        $scope.globalNetworkCount = networks.length;
        networks.push({Scope: "local", Name: "bridge"});
        networks.push({Scope: "local", Name: "host"});
        networks.push({Scope: "local", Name: "none"});
      } else {
        $scope.formValues.network = _.find(networks, function(o) { return o.Name === "bridge"; });
      }
      $scope.availableNetworks = networks;
    }, function (e) {
      Messages.error("Failure", e, "Unable to retrieve networks");
    });
    Container.query({all: 0}, function (d) {
      var containers = d;
      if (containersToHideLabels) {
        containers = ContainerHelper.hideContainers(d, containersToHideLabels);
      }
      $scope.runningContainers = containers;
    }, function (e) {
      Messages.error("Failure", e, "Unable to retrieve running containers");
    });
    initTemplates();
  });
}]);
