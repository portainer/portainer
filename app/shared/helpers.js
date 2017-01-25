angular.module('portainer.helpers', [])
.factory('InfoHelper', [function InfoHelperFactory() {
  'use strict';
  return {
    determineEndpointMode: function(info) {
      var mode = {
        provider: '',
        role: ''
      };
      if (_.startsWith(info.ServerVersion, 'swarm')) {
        mode.provider = "DOCKER_SWARM";
        if (info.SystemStatus[0][1] === 'primary') {
          mode.role = "PRIMARY";
        } else {
          mode.role = "REPLICA";
        }
      } else {
        if (!info.Swarm || _.isEmpty(info.Swarm.NodeID)) {
          mode.provider = "DOCKER_STANDALONE";
        } else {
          mode.provider = "DOCKER_SWARM_MODE";
          if (info.Swarm.ControlAvailable) {
            mode.role = "MANAGER";
          } else {
            mode.role = "WORKER";
          }
        }
      }
      return mode;
    }
  };
}])      
.factory('LabelHelper', [function LabelHelperFactory() {
  'use strict';
  return {
    fromLabelHashToKeyValue: function(labels) {
      if (labels) {
        return Object.keys(labels).map(function(key) {
          return {key: key, value: labels[key], originalKey: key, originalValue: labels[key], added: true};
        });
      }
      return [];
    },
    fromKeyValueToLabelHash: function(labelKV) {
      var labels = {};
      if (labelKV) {
        labelKV.forEach(function(label) {
          labels[label.key] = label.value;
        });
      }
      return labels;
    }
  };
}])
.factory('ImageHelper', [function ImageHelperFactory() {
  'use strict';
  return {
    createImageConfigForCommit: function(imageName, registry) {
      var imageNameAndTag = imageName.split(':');
      var image = imageNameAndTag[0];
      if (registry) {
        image = registry + '/' + imageNameAndTag[0];
      }
      var imageConfig = {
        repo: image,
        tag: imageNameAndTag[1] ? imageNameAndTag[1] : 'latest'
      };
      return imageConfig;
    },
    createImageConfigForContainer: function (imageName, registry) {
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
  };
}])
.factory('ContainerHelper', [function ContainerHelperFactory() {
  'use strict';
  return {
    hideContainers: function(containers, containersToHideLabels) {
      return containers.filter(function (container) {
        var filterContainer = false;
        containersToHideLabels.forEach(function(label, index) {
          if (_.has(container.Labels, label.name) &&
          container.Labels[label.name] === label.value) {
            filterContainer = true;
          }
        });
        if (!filterContainer) {
          return container;
        }
      });
    }
  };
}])
.factory('ServiceHelper', [function ServiceHelperFactory() {
  'use strict';
  return {
    serviceToConfig: function(service) {
      return {
        Name: service.Spec.Name,
        Labels: service.Spec.Labels,
        TaskTemplate: service.Spec.TaskTemplate,
        Mode: service.Spec.Mode,
        UpdateConfig: service.Spec.UpdateConfig,
        Networks: service.Spec.Networks,
        EndpointSpec: service.Spec.EndpointSpec
      };
    }
  };
}])
.factory('NodeHelper', [function NodeHelperFactory() {
  'use strict';
  return {
    nodeToConfig: function(node) {
      return {
        Name: node.Spec.Name,
        Role: node.Spec.Role,
        Labels: node.Spec.Labels,
        Availability: node.Spec.Availability
      };
    }
  };
}])
.factory('TemplateHelper', [function TemplateHelperFactory() {
  'use strict';
  return {
    getPortBindings: function(ports) {
      var bindings = [];
      ports.forEach(function (port) {
        var portAndProtocol = _.split(port, '/');
        var binding = {
          containerPort: portAndProtocol[0],
          protocol: portAndProtocol[1]
        };
        bindings.push(binding);
      });
      return bindings;
    },
    //Not used atm, may prove useful later
    getVolumeBindings: function(volumes) {
      var bindings = [];
      volumes.forEach(function (volume) {
        bindings.push({ containerPath: volume });
      });
      return bindings;
    },
    //Not used atm, may prove useful later
    getEnvBindings: function(env) {
      var bindings = [];
      env.forEach(function (envvar) {
        var binding = {
          name: envvar.name
        };
        if (envvar.set) {
          binding.value = envvar.set;
        }
        bindings.push(binding);
      });
      return bindings;
    }
  };
}]);
