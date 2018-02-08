angular.module('portainer.docker')
.factory('InfoHelper', [function InfoHelperFactory() {
  'use strict';
  return {
    determineEndpointMode: function(info) {
      var mode = {
        provider: '',
        role: ''
      };
      if (_.startsWith(info.ServerVersion, 'swarm')) {
        mode.provider = 'DOCKER_SWARM';
        if (info.SystemStatus[0][1] === 'primary') {
          mode.role = 'PRIMARY';
        } else {
          mode.role = 'REPLICA';
        }
      } else {
        if (!info.Swarm || _.isEmpty(info.Swarm.NodeID)) {
          if (info.ID === 'vSphere Integrated Containers') {
            mode.provider = 'VMWARE_VIC';
          } else {
            mode.provider = 'DOCKER_STANDALONE';
          }
        } else {
          mode.provider = 'DOCKER_SWARM_MODE';
          if (info.Swarm.ControlAvailable) {
            mode.role = 'MANAGER';
          } else {
            mode.role = 'WORKER';
          }
        }
      }
      return mode;
    }
  };
}]);
