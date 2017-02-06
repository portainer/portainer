angular.module('portainer.helpers')
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
