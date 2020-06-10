import _ from 'lodash-es';

angular.module('portainer.docker').factory('InfoHelper', [
  function InfoHelperFactory() {
    'use strict';

    var helper = {};

    helper.determineEndpointMode = function (info, type) {
      var mode = {
        provider: '',
        role: '',
        agentProxy: false,
      };

      if (type === 2 || type === 4) {
        mode.agentProxy = true;
      }

      if (!info.Swarm || _.isEmpty(info.Swarm.NodeID)) {
        mode.provider = 'DOCKER_STANDALONE';
      } else {
        mode.provider = 'DOCKER_SWARM_MODE';
        if (info.Swarm.ControlAvailable) {
          mode.role = 'MANAGER';
        } else {
          mode.role = 'WORKER';
        }
      }
      return mode;
    };

    return helper;
  },
]);
