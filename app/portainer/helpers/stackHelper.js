import _ from 'lodash-es';

angular.module('portainer.app').factory('StackHelper', [
  function StackHelperFactory() {
    'use strict';
    var helper = {};

    helper.getExternalStacksFromContainers = function (containers) {
      var stacks = [];

      for (var i = 0; i < containers.length; i++) {
        var container = containers[i];
        if (!container.Labels || !container.Labels['com.docker.compose.project']) continue;
        var stackName = container.Labels['com.docker.compose.project'];
        stacks.push({ stackName, creationDate: container.Created });
      }

      return _.uniq(stacks);
    };

    helper.getExternalStacksFromServices = function (services) {
      var stacks = [];

      for (var i = 0; i < services.length; i++) {
        var service = services[i];
        if (!service.Labels || !service.Labels['com.docker.stack.namespace']) continue;

        var stackName = service.Labels['com.docker.stack.namespace'];
        stacks.push({ stackName, creationDate: service.Created });
      }

      return _.uniq(stacks);
    };

    return helper;
  },
]);
