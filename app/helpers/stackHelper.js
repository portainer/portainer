angular.module('portainer.helpers')
.factory('StackHelper', [function StackHelperFactory() {
  'use strict';
  var helper = {};

  function mapValuesToArray(stackMap) {
    var stacks = [];
    for (var key in stackMap) {
      if (stackMap.hasOwnProperty(key)) {
        stacks.push(stackMap[key]);
      }
    }
    return stacks;
  }

  helper.getComposeV2StacksFromContainers = function(containers) {
    var stackMap = {};

    for (var i = 0; i < containers.length; i++) {
      var container = containers[i];
      if (!container.Labels || !container.Labels['com.docker.compose.project']) continue;

      var projectName = container.Labels['com.docker.compose.project'];
      if (!stackMap[projectName]) {
        stackMap[projectName] = new StackViewModel({ Name: projectName, Type: 'v2', ServiceCount: 1 });
      } else {
        stackMap[projectName].ServiceCount++;
      }
    }

    return mapValuesToArray(stackMap);
  };

  helper.getComposeV2ServicesFromContainers = function(containers) {
    var serviceMap = {};

    for (var i = 0; i < containers.length; i++) {
      var container = containers[i];
      if (!container.Labels || !container.Labels['com.docker.compose.service']) continue;

      var serviceName = container.Labels['com.docker.compose.service'];
      if (!serviceMap[serviceName]) {
        serviceMap[serviceName] = { Name: serviceName, 'ContainerCount': 1 };
      } else {
        serviceMap[serviceName].ContainerCount++;
      }
    }

    return mapValuesToArray(serviceMap);
  };

  helper.getComposeV3StacksFromServices = function(services) {
    var stackMap = {};

    for (var i = 0; i < services.length; i++) {
      var service = services[i];
      if (!service.Labels || !service.Labels['com.docker.stack.namespace']) continue;

      var stackName = service.Labels['com.docker.stack.namespace'];
      if (!stackMap[stackName]) {
        stackMap[stackName] = new StackViewModel({ Name: stackName, Type: 'v3', ServiceCount: 1 });
      } else {
        stackMap[stackName].ServiceCount++;
      }
    }

    return mapValuesToArray(stackMap);
  };

  return helper;
}]);
