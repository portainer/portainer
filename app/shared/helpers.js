angular.module('portainer.helpers', [])
.factory('ImageHelper', [function ImageHelperFactory() {
  'use strict';
  return {
    createImageConfig: function(imageName, registry) {
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
