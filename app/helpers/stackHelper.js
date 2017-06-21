angular.module('portainer.helpers')
.factory('StackHelper', [function StackHelperFactory() {
  'use strict';
  var helper = {};

  function stackMapToArray(stackMap) {
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

    return stackMapToArray(stackMap);
  };

  helper.getComposeV3StacksFromServices = function(services) {
    var stackMap = {};

    for (var j = 0; j < services.length; j++) {
      var service = services[i];
      if (!service.Labels || !service.Labels['com.docker.stack.namespace']) continue;

      var stackName = container.Labels['com.docker.compose.project'];
      if (!stackMap[stackName]) {
        stackMap[stackName] = new StackViewModel({ Name: stackName, Type: 'v3', ServiceCount: 1 });
      } else {
        stackMap[stackName].ServiceCount++;
      }
    }

    return stackMapToArray(stackMap);
  };

  return helper;
}]);
