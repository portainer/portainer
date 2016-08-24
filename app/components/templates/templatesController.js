angular.module('templates', [])
.controller('TemplatesController', ['$scope', '$q', '$state', 'Config', 'Container', 'Image', 'Volume', 'Network', 'Templates', 'Messages', 'errorMsgFilter',
function ($scope, $q, $state, Config, Container, Image, Volume, Network, Templates, Messages, errorMsgFilter) {
$scope.templates = [];
$scope.selectedTemplate = null;
$scope.formValues = {
  network: "",
  name: ""
};

var selectedItem = -1;

// TODO: centralize, already present in createContainerController
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

// TODO: centralize, already present in createContainerController
function pullImageAndCreateContainer(imageConfig, containerConfig) {
  Image.create(imageConfig, function (data) {
      var err = data.length > 0 && data[data.length - 1].hasOwnProperty('error');
      if (err) {
        var detail = data[data.length - 1];
        $('#createContainerSpinner').hide();
        Messages.error('Error', detail.error);
      } else {
        createContainer(containerConfig);
      }
  }, function (e) {
    $('#createContainerSpinner').hide();
    Messages.error('Error', 'Unable to pull image ' + image);
  });
}

function createConfigFromTemplate(template) {
  var containerConfig = {
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
      NetworkMode: $scope.formValues.network,
      Privileged: false
    },
    Image: template.image,
    Volumes: {},
    name: $scope.formValues.name
  };
  if (template.env) {
    template.env.forEach(function (v) {
      if (v.value || v.default) {
        var val = v.default ? v.default : v.value;
        containerConfig.Env.push(v.name + "=" + val);
      }
    });
  }
  if (template.ports) {
    template.ports.forEach(function (p) {
      containerConfig.ExposedPorts[p] = {};
      containerConfig.HostConfig.PortBindings[p] = [{ HostPort: ""}];
    });
  }
  return containerConfig;
}

function generateUUID(){
  var d = moment().millisecond();
  if(window.performance && typeof window.performance.now === "function"){
    d += performance.now(); //use high-precision timer if available
  }
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c==='x' ? r : (r&0x3|0x8)).toString(16);
  });
  return uuid;
}

function prepareVolumeQueries(template, containerConfig) {
  var volumeQueries = [];
  if (template.volumes) {
    template.volumes.forEach(function (vol) {
      var uuid = generateUUID();
      var volumeConfig = {
        Name: uuid,
        Driver: 'local-persist',
        DriverOpts: {
          mountpoint: '/volume/' + uuid
        }
      };
      volumeQueries.push(
        Volume.create(volumeConfig, function (d) {
          if (d.Name) {
            Messages.send("Volume created", d.Name);
            containerConfig.Volumes[vol] = {};
            containerConfig.HostConfig.Binds.push(d.Name + ':' + vol);
          } else {
            Messages.error('Unable to create volume', errorMsgFilter(d));
          }
        }, function (e) {
          Messages.error('Unable to create volume', e.data);
        }).$promise
      );
    });
  }
  return volumeQueries;
}

$scope.createTemplate = function() {
  $('#createContainerSpinner').show();
  var template = $scope.selectedTemplate;
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
    $scope.selectedTemplate = null;
  } else {
    $('#template_' + selectedItem).toggleClass("container-template--selected");
    selectedItem = id;
    $scope.selectedTemplate = $scope.templates[id];
  }
};

function initTemplates() {
  Templates.get(function (data) {
    $scope.templates = data;
    $('#loadTemplatesSpinner').hide();
  }, function (e) {
    $('#loadTemplatesSpinner').hide();
    Messages.error("Unable to retrieve apps list", e.data);
  });
}

Config.$promise.then(function (c) {
  var swarm = c.swarm;
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
    } else {
      $scope.formValues.network = "bridge";
    }
    $scope.availableNetworks = networks;
  }, function (e) {
    Messages.error("Unable to retrieve available networks", e.data);
  });
  initTemplates();
});
}]);
